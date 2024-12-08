/**
 * Copyright 2024
 *
 * Authors:
 *  - Eugen Mayer (KontextWork)
 */

const { htmlToText } = require("html-to-text");
const { tokenizeString } = require("../../../tokenizer");
const { sanitizeFileName, writeToServerDocuments } = require("../../../files");
const { default: slugify } = require("slugify");
const { v4 } = require("uuid");
const path = require("path");
const fs = require("fs");

class Page {
  constructor({ id, title, created, type, processedBody, url }) {
    this.id = id;
    this.title = title;
    this.url = url;
    this.created = created;
    this.type = type;
    this.processedBody = processedBody;
  }
}

class DrupalWiki {
  /**
   *
   * @param baseUrl
   * @param spaceId
   * @param accessToken
   */
  constructor({ baseUrl, accessToken }) {
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;
    this.storagePath = this.#prepareStoragePath(baseUrl);
  }

  /**
   * Load all pages for the given space, fetching storing each page one by one
   * to minimize the memory usage
   *
   * @param {number} spaceId
   * @param {import("../../EncryptionWorker").EncryptionWorker} encryptionWorker
   * @returns {Promise<void>}
   */
  async loadAndStoreAllPagesForSpace(spaceId, encryptionWorker) {
    const pageIndex = await this.#getPageIndexForSpace(spaceId);
    for (const pageId of pageIndex) {
      try {
        const page = await this.loadPage(pageId);
        this.#storePage(page, encryptionWorker);
      } catch (e) {
        console.error(
          `Could not process DrupalWiki page ${pageId} (skipping and continuing): `
        );
        console.error(e);
      }
    }
  }

  /**
   *
   * @param {number} pageId
   * @returns {Promise<Page>}
   */
  async loadPage(pageId) {
    return this.#fetchPage(pageId);
  }

  /**
   * Fetches the page ids for the configured space
   * @param {number} spaceId
   * @returns{Promise<number[]>} array of pageIds
   */
  async #getPageIndexForSpace(spaceId) {
    // errors on fetching the pageIndex is fatal, no error handling
    const data = await this._doFetch(
      `${this.baseUrl}/api/rest/scope/api/page/index?space=${spaceId}`
    );
    return data.map((page) => {
      return Number(page.id);
    });
  }

  /**
   * @param pageId
   * @returns {Promise<Page>}
   */
  async #fetchPage(pageId) {
    const data = await this._doFetch(
      `${this.baseUrl}/api/rest/scope/api/page/${pageId}`
    );
    return new Page({
      id: data.id,
      title: data.title,
      created: data.lastModified,
      type: data.type,
      processedBody: this.#processPageBody(data.body),
      url: `${this.baseUrl}/node/${data.id}`,
    });
  }

  /**
   * @param {Page} page
   * @param {import("../../EncryptionWorker").EncryptionWorker} encryptionWorker
   */
  #storePage(page, encryptionWorker) {
    const targetUUID = v4();
    const wordCount = page.processedBody.split(" ").length;
    const tokenCount =
      page.processedBody.length > 0
        ? tokenizeString(page.processedBody).length
        : 0;
    const data = {
      id: targetUUID,
      url: page.url,
      title: page.title,
      docAuthor: this.baseUrl,
      description: page.title,
      docSource: `${this.baseUrl} DrupalWiki`,
      chunkSource: this.#generateChunkSource(page.id, encryptionWorker),
      published: new Date().toLocaleString(),
      wordCount: wordCount,
      pageContent: page.processedBody,
      token_count_estimate: tokenCount,
    };

    const fileName = sanitizeFileName(`${slugify(page.title)}-${data.id}`);
    console.log(
      `[DrupalWiki Loader]: Saving page '${page.title}' (${page.id}) to '${this.storagePath}/${fileName}'`
    );
    writeToServerDocuments(data, fileName, this.storagePath);
  }

  /**
   * Generate the full chunkSource for a specific Confluence page so that we can resync it later.
   * This data is encrypted into a single `payload` query param so we can replay credentials later
   * since this was encrypted with the systems persistent password and salt.
   * @param {number} pageId
   * @param {import("../../EncryptionWorker").EncryptionWorker} encryptionWorker
   * @returns {string}
   */
  #generateChunkSource(pageId, encryptionWorker) {
    const payload = {
      baseUrl: this.baseUrl,
      pageId: pageId,
      accessToken: this.accessToken,
    };
    return `drupalwiki://${this.baseUrl}?payload=${encryptionWorker.encrypt(
      JSON.stringify(payload)
    )}`;
  }

  async _doFetch(url) {
    const response = await fetch(url, {
      headers: this.#getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    return response.json();
  }

  #getHeaders() {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  #prepareStoragePath(baseUrl) {
    const { hostname } = new URL(baseUrl);
    const subFolder = slugify(`drupalwiki-${hostname}`).toLowerCase();

    const outFolder =
      process.env.NODE_ENV === "development"
        ? path.resolve(
            __dirname,
            `../../../../server/storage/documents/${subFolder}`
          )
        : path.resolve(process.env.STORAGE_DIR, `documents/${subFolder}`);

    if (!fs.existsSync(outFolder)) {
      fs.mkdirSync(outFolder, { recursive: true });
    }
    return outFolder;
  }

  /**
   * @param {string} body
   * @returns {string}
   * @private
   */
  #processPageBody(body) {
    const plainTextContent = htmlToText(body, {
      wordwrap: false,
      preserveNewlines: true,
    });
    // preserve structure
    return plainTextContent.replace(/\n{3,}/g, "\n\n");
  }
}

module.exports = { DrupalWiki };

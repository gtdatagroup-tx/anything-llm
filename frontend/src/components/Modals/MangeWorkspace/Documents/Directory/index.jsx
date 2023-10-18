import UploadFile from "../UploadFile";
import PreLoader from "../../../../Preloader";
import { useEffect, useRef, useState } from "react";
import { CaretDown, File, FolderNotch, Trash } from "@phosphor-icons/react";
import System from "../../../../../models/system";

export default function Directory({
  files,
  loading,
  fileTypes,
  workspace,
  fetchKeys,
  selectedItems,
  setSelectedItems,
  setHighlightWorkspace,
  moveToWorkspace,
}) {
  const [amountSelected, setAmountSelected] = useState(0);

  const toggleSelection = (item) => {
    setSelectedItems((prevSelectedItems) => {
      const newSelectedItems = { ...prevSelectedItems };

      if (item.type === "folder") {
        const isCurrentlySelected = isFolderCompletelySelected(item);
        if (isCurrentlySelected) {
          item.items.forEach((file) => delete newSelectedItems[file.id]);
        } else {
          item.items.forEach((file) => (newSelectedItems[file.id] = true));
        }
      } else {
        if (newSelectedItems[item.id]) {
          delete newSelectedItems[item.id];
        } else {
          newSelectedItems[item.id] = true;
        }
      }

      return newSelectedItems;
    });
  };

  const isFolderCompletelySelected = (folder) => {
    return folder.items.every((file) => selectedItems[file.id]);
  };

  const isSelected = (id, item) => {
    if (item && item.type === "folder") {
      return isFolderCompletelySelected(item);
    }

    return !!selectedItems[id];
  };

  useEffect(() => {
    setAmountSelected(Object.keys(selectedItems).length);
  }, [selectedItems]);

  return (
    <div className="px-8 pb-8">
      <div className="flex flex-col gap-y-6">
        <div className="flex items-center justify-between w-[560px] px-5">
          <h3 className="text-white text-base font-bold">My Documents</h3>
        </div>

        <div className="relative w-[560px] h-[310px] bg-zinc-900 rounded-2xl">
          <div className="rounded-t-2xl text-white/80 text-xs grid grid-cols-12 py-2 px-8 border-b border-white/20 shadow-lg bg-zinc-900 sticky top-0 z-10">
            <p className="col-span-4">Name</p>
            <p className="col-span-2">Date</p>
            <p className="col-span-2">Size</p>
            <p className="col-span-2">Kind</p>
            <p className="col-span-2">Cached</p>
          </div>

          <div
            className="overflow-y-auto pb-9"
            style={{ height: "calc(100% - 40px)" }}
          >
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <PreLoader />
              </div>
            ) : !!files.items ? (
              files.items.map((item, index) =>
                item.type === "folder" ? (
                  <FolderRow
                    key={index}
                    item={item}
                    selected={isSelected(
                      item.id,
                      item.type === "folder" ? item : null
                    )}
                    onRowClick={() => toggleSelection(item)}
                    toggleSelection={toggleSelection}
                    isSelected={isSelected}
                  />
                ) : (
                  <p>file</p>
                )
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-white text-opacity-40 text-sm font-medium">
                  No Documents
                </p>
              </div>
            )}
          </div>

          {amountSelected !== 0 && (
            <div className="absolute bottom-0 left-0 w-full flex justify-center items-center h-9 bg-white rounded-b-2xl">
              <div className="flex gap-x-5">
                <div
                  onMouseEnter={() => setHighlightWorkspace(true)}
                  onMouseLeave={() => setHighlightWorkspace(false)}
                  onClick={moveToWorkspace}
                  className="text-sm font-semibold h-7 px-2.5 rounded-lg transition-all duration-300 hover:text-white hover:bg-neutral-800/80 cursor-pointer flex items-center"
                >
                  Move{" "}
                  {amountSelected === 1
                    ? `${amountSelected} file`
                    : `${amountSelected} files`}{" "}
                  to workspace
                </div>
              </div>
            </div>
          )}
        </div>

        <UploadFile
          fileTypes={fileTypes}
          workspace={workspace}
          fetchKeys={fetchKeys}
        />
      </div>
    </div>
  );
}

function FolderRow({
  item,
  selected,
  onRowClick,
  toggleSelection,
  isSelected,
}) {
  const [expanded, setExpanded] = useState(true);

  const handleExpandClick = (event) => {
    event.stopPropagation();
    setExpanded(!expanded);
  };


  return (
    <>
      <div
        onClick={onRowClick}
        className={`transition-all duration-200 text-white/80 text-xs grid grid-cols-12 py-2 pl-3.5 pr-8 border-b border-white/20 hover:bg-sky-500/20 cursor-pointer w-full ${
          selected ? "bg-sky-500/20" : ""
        }`}
      >
        <div className="col-span-4 flex gap-x-[4px] items-center">
          <div
            className="w-3 h-3 rounded border-[1px] border-white flex justify-center items-center cursor-pointer"
            role="checkbox"
            aria-checked={selected}
            tabIndex={0}
          >
            {selected && <div className="w-2 h-2 bg-white rounded-[2px]" />}
          </div>
          <div
            onClick={handleExpandClick}
            className={`transform transition-transform duration-200 ${
              expanded ? "rotate-360" : " rotate-270"
            }`}
          >
            <CaretDown className="text-base font-bold w-4 h-4" />
          </div>
          <FolderNotch
            className="text-base font-bold w-4 h-4 mr-[3px]"
            weight="fill"
          />
          <p className="whitespace-nowrap overflow-hidden">
            {truncate(item.name, 20)}
          </p>
        </div>
        <p className="col-span-2 pl-3.5">---</p>
        <p className="col-span-2 pl-3">{item.size}</p>
        <p className="col-span-2 pl-2">{document.kind}</p>
        <div className="col-span-2 flex justify-end items-center">
          {item.cached && (
            <div className="bg-white/10 rounded-3xl">
              <p className="text-xs px-2 py-0.5">Cached</p>
            </div>
          )}
        </div>
      </div>
      {expanded && (
        <div className="col-span-full">
          {item.items.map((fileItem) => (
            <FileRow
              key={fileItem.id}
              item={fileItem}
              selected={isSelected(fileItem.id)}
              expanded={expanded}
              onRowClick={() => toggleSelection(fileItem)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function FileRow({ item, selected, onRowClick, expanded }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeoutRef = useRef(null);

  const onTrashClick = async (event) => {
    event.stopPropagation();
    if (
      !window.confirm(
        "Are you sure you want to delete this document?\nThis will require you to re-upload and re-embed it.\nThis document will be removed from any workspace that is currently referencing it.\nThis action is not reversible."
      )
    ) {
      return false;
    }

    try {
      console.log(item.name, item);
      await System.deleteDocument(item.name, item);
    } catch (error) {
      console.error("Failed to delete the document:", error);
    }
  };

  const handleMouseEnter = () => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    clearTimeout(tooltipTimeoutRef.current);
    setShowTooltip(false);
  };

  useEffect(() => {
    return () => {
      clearTimeout(tooltipTimeoutRef.current);
    };
  }, []);

  return (
    <div
      onClick={onRowClick}
      className={`transition-all duration-200 text-white/80 text-xs grid grid-cols-12 py-2 pl-3.5 pr-8 border-b border-white/20 hover:bg-sky-500/20 cursor-pointer ${`${
        selected ? "bg-sky-500/20" : ""
      } ${expanded ? "bg-sky-500/10" : ""}`}`}
    >
      <div className="col-span-4 flex gap-x-[4px] items-center">
        <div
          className="w-3 h-3 rounded border-[1px] border-white flex justify-center items-center cursor-pointer"
          role="checkbox"
          aria-checked={selected}
          tabIndex={0}
        >
          {selected && <div className="w-2 h-2 bg-white rounded-[2px]" />}
        </div>
        <File className="text-base font-bold w-4 h-4 mr-[3px]" weight="fill" />
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <p className="whitespace-nowrap overflow-hidden">
            {truncate(item.title, 17)}
          </p>
          {showTooltip && (
            <div className="absolute left-0 bg-white text-black p-1.5 rounded shadow-lg whitespace-nowrap">
              {item.title}
            </div>
          )}
        </div>
      </div>
      <p className="col-span-2 pl-3.5 whitespace-nowrap">
        {formatDate(item?.published)}
      </p>
      <p className="col-span-2 pl-3">{item?.size || "---"}</p>
      <p className="col-span-2 pl-2 uppercase">{getFileExtension(item.url)}</p>
      <div className="col-span-2 flex justify-end items-center">
        {item?.cached && (
          <div className="bg-white/10 rounded-3xl">
            <p className="text-xs px-2 py-0.5">Cached</p>
          </div>
        )}
        <Trash
          onClick={onTrashClick}
          className="text-base font-bold w-4 h-4 ml-2 flex-shrink-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

function truncate(str, n) {
  const fileExtensionPattern = /(\..+)$/;
  const extensionMatch = str.match(fileExtensionPattern);

  if (extensionMatch && extensionMatch[1]) {
    const extension = extensionMatch[1];
    const nameWithoutExtension = str.replace(fileExtensionPattern, "");
    const truncationPoint = Math.max(0, n - extension.length - 4);
    const truncatedName =
      nameWithoutExtension.substr(0, truncationPoint) +
      "..." +
      nameWithoutExtension.slice(-4);

    return truncatedName + extension;
  } else {
    return str.length > n ? str.substr(0, n - 8) + "..." + str.slice(-4) : str;
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const options = { year: "numeric", month: "short", day: "numeric" };
  const formattedDate = date.toLocaleDateString("en-US", options);
  return formattedDate;
};

function getFileExtension(path) {
  const match = path.match(/[^\/\\&\?]+\.\w{1,4}(?=([\?&].*$|$))/);
  return match ? match[0].split(".").pop() : "file";
}

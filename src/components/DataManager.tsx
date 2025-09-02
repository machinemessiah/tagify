import React, { useState, useRef } from "react";
import styles from "./DataManager.module.css";
import "../styles/globals.css";
import { TagDataStructure } from "../hooks/useTagData";
// import { fullRefreshPlaylistCache, incrementalRefreshPlaylistCache } from "../utils/PlaylistCache";
// import PlaylistSettingsModal from "./PlaylistSettings";
// import RefreshModal from "./RefreshModal";
import MainSettingsModal from "./MainSettingsModal";
import InfoModal from "./InfoModal";
import { Settings } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faUpload } from "@fortawesome/free-solid-svg-icons";

interface DataManagerProps {
  onExportTagData: () => void;
  onImportTagData: (data: TagDataStructure) => void;
  onExportRekordbox: () => void;
  lastSaved: Date | null;
}

const DataManager: React.FC<DataManagerProps> = ({
  onExportTagData,
  onImportTagData,
  onExportRekordbox,
  lastSaved,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showMainSettings, setShowMainSettings] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (
          data &&
          typeof data === "object" &&
          data.categories &&
          Array.isArray(data.categories) &&
          data.tracks &&
          typeof data.tracks === "object"
        ) {
          onImportTagData(data);
          Spicetify.showNotification("Data imported successfully!");
        } else {
          console.error("Invalid backup structure:", data);
          Spicetify.showNotification("Invalid backup file format", true);
        }
      } catch (error) {
        console.error("Error parsing backup file:", error);
        Spicetify.showNotification("Error importing backup", true);
      } finally {
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.onerror = () => {
      Spicetify.showNotification("Error reading backup file", true);
    };

    reader.readAsText(file);
  };

  return (
    <div className={styles.controlBar}>
      <div className={styles.actionPills}>
        <div className={styles.primaryPill}>
          <button
            className={`${styles.pillButton} ${styles.exportButton}`}
            onClick={onExportTagData}
            title="Backup your tag data"
          >
            <FontAwesomeIcon icon={faDownload} /> Backup
          </button>
          <button
            className={`${styles.pillButton} ${styles.importButton}`}
            onClick={handleImportClick}
            title="Import your tag data"
          >
            <FontAwesomeIcon icon={faUpload} /> Import
          </button>
        </div>

        <div className={styles.secondaryPill}>
          <button
            className={`${styles.pillButton} ${styles.statsButton}`}
            onClick={onExportRekordbox}
            title="View your tag stats"
          >
            <i className="fa-solid fa-chart-simple"></i> Stats
          </button>
          <button
            className={`${styles.pillButton} ${styles.infoButton}`}
            onClick={() => setShowInfoModal(true)}
            title="Help & Tutorial"
          >
            <i className="fa-solid fa-info"></i> Info
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {lastSaved && (
        <div className={styles.saveStatus}>
          ✓ Last backup: {lastSaved.toLocaleString()}
        </div>
      )}
      <button
        className={styles.settingsButton}
        onClick={() => setShowMainSettings(true)}
        title="Settings"
      >
        <Settings size={20} />
      </button>
      {showMainSettings && (
        <MainSettingsModal onClose={() => setShowMainSettings(false)} />
      )}
      {showInfoModal && <InfoModal onClose={() => setShowInfoModal(false)} />}
    </div>
  );
};

export default DataManager;

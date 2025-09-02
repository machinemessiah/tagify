import React, { useState } from "react";
import Portal from "../utils/Portal";
import styles from "./DiscoverySurvey.module.css";
import packageJson from "../../package.json";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faReddit,
  faYoutube,
  faDiscord,
} from "@fortawesome/free-brands-svg-icons";
import {
  faUsers,
  faSearch,
  faCircleQuestion,
  faChampagneGlasses,
} from "@fortawesome/free-solid-svg-icons";

interface DiscoverySurveyProps {
  onCompleteSurvey: (source: string, otherDetails?: string) => void;
  onSkipSurvey: () => void;
}

const DiscoverySurvey: React.FC<DiscoverySurveyProps> = ({
  onCompleteSurvey,
  onSkipSurvey,
}) => {
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [otherDetails, setOtherDetails] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const discoveryOptions = [
    {
      id: "github",
      label: (
        <>
          <FontAwesomeIcon icon={faGithub} /> GitHub Repository
        </>
      ),
      value: "github",
    },
    {
      id: "reddit",
      label: (
        <>
          <FontAwesomeIcon icon={faReddit} /> Reddit
        </>
      ),
      value: "reddit",
    },
    {
      id: "youtube",
      label: (
        <>
          <FontAwesomeIcon icon={faYoutube} /> YouTube
        </>
      ),
      value: "youtube",
    },
    {
      id: "discord",
      label: (
        <>
          <FontAwesomeIcon icon={faDiscord} /> Discord
        </>
      ),
      value: "discord",
    },
    {
      id: "friend",
      label: (
        <>
          <FontAwesomeIcon icon={faUsers} /> Friend/Word of Mouth
        </>
      ),
      value: "friend",
    },
    {
      id: "search",
      label: (
        <>
          <FontAwesomeIcon icon={faSearch} /> Search Engine
        </>
      ),
      value: "search",
    },
    {
      id: "other",
      label: (
        <>
          <FontAwesomeIcon icon={faCircleQuestion} /> Other
        </>
      ),
      value: "other",
    },
  ];

  const handleSubmit = async () => {
    if (!selectedSource) return;

    setIsSubmitting(true);

    // Small delay for better UX feedback
    await new Promise((resolve) => setTimeout(resolve, 500));

    onCompleteSurvey(
      selectedSource,
      selectedSource === "other" ? otherDetails : undefined
    );

    Spicetify.showNotification("Thanks for your feedback!");
  };

  const handleSkip = () => {
    onSkipSurvey();
  };

  return (
    <Portal>
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <div className={styles.titleSection}>
              <FontAwesomeIcon icon={faChampagneGlasses} size="2x" />
              <div>
                <h2 className={styles.modalTitle}>
                  Welcome to Tagify {packageJson.version}!
                </h2>
                <p className={styles.subtitle}>
                  Enjoy the latest version of Tagify
                </p>
              </div>
            </div>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.questionSection}>
              <h3 className={styles.questionTitle}>
                How did you discover Tagify?
              </h3>
              <p className={styles.questionSubtext}>
                Share how you found Tagify and help us improve. More feedback
                means a stronger app with more great features for you.
              </p>

              <div className={styles.optionsGrid}>
                {discoveryOptions.map((option) => (
                  <button
                    key={option.id}
                    className={`${styles.optionButton} ${
                      selectedSource === option.value
                        ? styles.optionSelected
                        : ""
                    }`}
                    onClick={() => setSelectedSource(option.value)}
                  >
                    <span className={styles.optionText}>{option.label}</span>
                    <div className={styles.radioIndicator}>
                      {selectedSource === option.value && (
                        <div className={styles.radioSelected}></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {selectedSource === "other" && (
                <div className={styles.otherInputSection}>
                  <label htmlFor="other-details" className={styles.otherLabel}>
                    Please specify:
                  </label>
                  <input
                    id="other-details"
                    type="text"
                    className={styles.otherInput}
                    value={otherDetails}
                    onChange={(e) => setOtherDetails(e.target.value)}
                    placeholder="e.g., blog post, tutorial, etc."
                    maxLength={100}
                  />
                </div>
              )}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <div className={styles.footerActions}>
              <button
                className={styles.skipButton}
                onClick={handleSkip}
                disabled={isSubmitting}
              >
                Skip
              </button>
              <button
                className={styles.submitButton}
                onClick={handleSubmit}
                disabled={!selectedSource || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className={styles.loadingSpinner}></span>
                    Submitting...
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default DiscoverySurvey;

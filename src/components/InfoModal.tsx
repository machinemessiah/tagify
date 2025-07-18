import React, { useState } from "react";
import Portal from "../utils/Portal";
import styles from "./InfoModal.module.css";

interface InfoModalProps {
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", title: "Overview", icon: "📖" },
    { id: "getting-started", title: "Getting Started", icon: "🚀" },
    { id: "tagging", title: "Tagging System", icon: "🏷️" },
    { id: "features", title: "Key Features", icon: "⭐" },
    { id: "advanced", title: "Advanced Features", icon: "🔧" }, // New section
  ];

  return (
    <Portal>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>
              <span className={styles.titleIcon}>🎵</span>
              Tagify Guide
            </h2>
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>

          <div className={styles.modalContent}>
            {/* Navigation Sidebar */}
            <div className={styles.sidebar}>
              <nav className={styles.navigation}>
                {sections.map((section) => (
                  <button
                    key={section.id}
                    className={`${styles.navButton} ${
                      activeSection === section.id ? styles.navButtonActive : ""
                    }`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <span className={styles.navIcon}>{section.icon}</span>
                    <span className={styles.navText}>{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Content Area */}
            <div className={styles.content}>
              {activeSection === "overview" && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Welcome to Tagify! 🎉</h3>
                  <p className={styles.text}>
                    Tagify is a powerful music organization tool that transforms how you manage and
                    discover your Spotify library. With an advanced tagging system, smart filtering,
                    and seamless integration with your music workflow, Tagify helps you create the
                    perfect soundtrack for any moment.
                  </p>

                  <div className={styles.featureGrid}>
                    <div className={styles.featureCard}>
                      <div className={styles.featureIcon}>🏷️</div>
                      <h4>Smart Tagging</h4>
                      <p>
                        Organize tracks with custom categories like mood, genre, energy, and context
                      </p>
                    </div>
                    <div className={styles.featureCard}>
                      <div className={styles.featureIcon}>⭐</div>
                      <h4>Rating System</h4>
                      <p>Rate tracks from 1-5 stars and set energy levels from 1-10</p>
                    </div>
                    <div className={styles.featureCard}>
                      <div className={styles.featureIcon}>🔍</div>
                      <h4>Advanced Filtering</h4>
                      <p>Find the perfect tracks using multiple filters and smart search</p>
                    </div>
                    <div className={styles.featureCard}>
                      <div className={styles.featureIcon}>📱</div>
                      <h4>Seamless Integration</h4>
                      <p>Works directly in Spotify with playlist creation and playback controls</p>
                    </div>
                  </div>

                  <div className={styles.callout}>
                    <div className={styles.calloutIcon}>💡</div>
                    <div>
                      <strong>New to Tagify?</strong> Start with the "Getting Started" section to
                      learn the basics, then explore the tagging system to begin organizing your
                      music!
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "getting-started" && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Getting Started</h3>

                  <div className={styles.stepsList}>
                    <div className={styles.step}>
                      <div className={styles.stepNumber}>1</div>
                      <div className={styles.stepContent}>
                        <h4>Start with a Track</h4>
                        <p>
                          Play any song in Spotify, or use the context menu "Tag with Tagify" on any
                          track to begin tagging.
                        </p>
                      </div>
                    </div>

                    <div className={styles.step}>
                      <div className={styles.stepNumber}>2</div>
                      <div className={styles.stepContent}>
                        <h4>Add Your First Tags</h4>
                        <p>
                          Use the tag selector to categorize your track. Try adding a genre, mood,
                          or energy level to start.
                        </p>
                      </div>
                    </div>

                    <div className={styles.step}>
                      <div className={styles.stepNumber}>3</div>
                      <div className={styles.stepContent}>
                        <h4>Set Ratings & Energy</h4>
                        <p>
                          Rate the track with stars (1-5) and set an energy level (1-10) to help
                          with filtering later.
                        </p>
                      </div>
                    </div>

                    <div className={styles.step}>
                      <div className={styles.stepNumber}>4</div>
                      <div className={styles.stepContent}>
                        <h4>Explore & Filter</h4>
                        <p>
                          Use the Track List to see all your tagged music and experiment with
                          filters to find specific vibes.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.tip}>
                    <strong>First-time tip:</strong> Start by tagging 10-15 songs with basic
                    categories like genre and mood. This will give you enough data to see how
                    filtering works!
                  </div>
                </div>
              )}

              {activeSection === "tagging" && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Tagging System</h3>

                  <div className={styles.subsection}>
                    <h4>How Tags Work</h4>
                    <p>Tags are organized in a three-level hierarchy:</p>
                    <div className={styles.hierarchy}>
                      <div className={styles.hierarchyLevel}>
                        <strong>Category</strong> →{" "}
                        <span className={styles.example}>Mood & Energy</span>
                      </div>
                      <div className={styles.hierarchyLevel}>
                        <strong>Subcategory</strong> →{" "}
                        <span className={styles.example}>Emotional Tone</span>
                      </div>
                      <div className={styles.hierarchyLevel}>
                        <strong>Tag</strong> →{" "}
                        <span className={styles.example}>Happy, Sad, Romantic</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.subsection}>
                    <h4>Default Categories</h4>
                    <div className={styles.categoryList}>
                      <div className={styles.categoryItem}>
                        <h5>🎵 Genre & Style</h5>
                        <p>Primary genres, sub-genres, and era classifications</p>
                      </div>
                      <div className={styles.categoryItem}>
                        <h5>😊 Mood & Energy</h5>
                        <p>Energy levels, emotional tones, and atmospheric qualities</p>
                      </div>
                      <div className={styles.categoryItem}>
                        <h5>🎸 Musical Elements</h5>
                        <p>Vocals, instruments, and production styles</p>
                      </div>
                      <div className={styles.categoryItem}>
                        <h5>🎯 Usage & Context</h5>
                        <p>Activities, timing, and social contexts for listening</p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.tip}>
                    <strong>Pro tip:</strong> You can customize the entire tag structure in "Manage
                    Tags" to fit your personal music organization style!
                  </div>
                </div>
              )}

              {activeSection === "features" && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Key Features</h3>

                  <div className={styles.featuresList}>
                    <div className={styles.featureDetail}>
                      <h4>🏷️ Mass Tagging</h4>
                      <p>
                        Select multiple tracks from context menus to tag them all at once. Select
                        multiple tracks (or Ctrl + A for whole playlist), right-click and press "Tag
                        with Tagify".
                      </p>
                    </div>

                    <div className={styles.featureDetail}>
                      <h4>🔒 Track Locking</h4>
                      <p>
                        Lock to a specific track to prevent it from changing when Spotify switches
                        songs. Perfect for detailed tagging sessions.
                      </p>
                    </div>

                    <div className={styles.featureDetail}>
                      <h4>🔍 Smart Filtering</h4>
                      <p>
                        Filter tracks by any combination of tags, ratings, and energy levels. Create
                        complex queries to find exactly what you're looking for.
                      </p>
                    </div>

                    <div className={styles.featureDetail}>
                      <h4>📱 Playlist Creation</h4>
                      <p>
                        Create Spotify playlists directly from your filtered results. Perfect for
                        generating mood-based or activity-specific playlists.
                      </p>
                    </div>

                    <div className={styles.featureDetail}>
                      <h4>🎵 Tracklist Integration</h4>
                      <p>
                        See tag information directly in your Spotify playlists with the "Tagify"
                        column that appears automatically.
                      </p>
                    </div>

                    <div className={styles.featureDetail}>
                      <h4>🎮 Now Playing Integration</h4>
                      <p>
                        View tag information for the currently playing track right in the Spotify
                        playbar.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* NEW ADVANCED FEATURES SECTION */}
              {activeSection === "advanced" && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Advanced Features</h3>

                  <div className={styles.advancedSection}>
                    <h4 className={styles.advancedSectionTitle}>🎵 BPM Management</h4>
                    <div className={styles.advancedFeature}>
                      <div className={styles.advancedFeatureContent}>
                        <h5>Update Track BPM</h5>
                        <p>
                          In the track details view, you can click on any BPM value to edit it
                          manually, or use the refresh button (↻) to fetch the latest BPM data from
                          Spotify's audio analysis.
                        </p>
                        <div className={styles.featureBenefit}>
                          <span className={styles.benefitIcon}>🎯</span>
                          <span>
                            Filter your entire library by BPM ranges to create perfect workout
                            playlists, DJ sets, or tempo-matched collections
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.advancedSection}>
                    <h4 className={styles.advancedSectionTitle}>🔧 Custom Tag Management</h4>
                    <div className={styles.advancedFeature}>
                      <div className={styles.advancedFeatureContent}>
                        <h5>Create Your Own Tag Structure</h5>
                        <p>
                          Click "Manage Tags" to completely customize your tagging system. Add new
                          categories, subcategories, and individual tags that match your music
                          organization style.
                        </p>
                        <div className={styles.featureBenefit}>
                          <span className={styles.benefitIcon}>🎨</span>
                          <span>
                            Build a personalized taxonomy that reflects how you actually think about
                            and organize your music
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.advancedSection}>
                    <h4 className={styles.advancedSectionTitle}>🔍 Advanced Filtering</h4>

                    <div className={styles.advancedFeature}>
                      <div className={styles.advancedFeatureContent}>
                        <h5>ALL vs ANY Filtering Logic</h5>
                        <div className={styles.filterExplanation}>
                          <div className={styles.filterMode}>
                            <span className={styles.filterBadge}>ALL</span>
                            <span>
                              Tracks must have <strong>every</strong> selected tag to appear in
                              results
                            </span>
                          </div>
                          <div className={styles.filterMode}>
                            <span className={styles.filterBadge}>ANY</span>
                            <span>
                              Tracks need <strong>at least one</strong> of the selected tags to
                              appear
                            </span>
                          </div>
                        </div>
                        <p className={styles.filterExample}>
                          Example: Filtering for "Rock" + "Upbeat" with ALL mode shows only tracks
                          tagged with both. ANY mode shows tracks with either tag.
                        </p>
                      </div>
                    </div>

                    <div className={styles.advancedFeature}>
                      <div className={styles.advancedFeatureContent}>
                        <h5>INCLUDE vs EXCLUDE Filtering</h5>
                        <div className={styles.filterExplanation}>
                          <div className={styles.filterMode}>
                            <span
                              className={styles.filterBadge}
                              style={{ backgroundColor: "#1e90ff" }}
                            >
                              INCLUDE
                            </span>
                            <span>
                              Show tracks that <strong>have</strong> these tags
                            </span>
                          </div>
                          <div className={styles.filterMode}>
                            <span
                              className={styles.filterBadge}
                              style={{ backgroundColor: "#ff4c4c" }}
                            >
                              EXCLUDE
                            </span>
                            <span>
                              Hide tracks that <strong>have</strong> these tags
                            </span>
                          </div>
                        </div>
                        <p className={styles.filterExample}>
                          Tip: Click a tag once to include it (blue), click again to exclude it
                          (red), click a third time to remove the filter entirely.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.advancedSection}>
                    <h4 className={styles.advancedSectionTitle}>📋 Smart Playlist Creation</h4>
                    <div className={styles.advancedFeature}>
                      <div className={styles.advancedFeatureContent}>
                        <h5>Create Playlists from Filters</h5>
                        <p>
                          After setting up your perfect filter combination, use the "Create
                          Playlist" button to generate a new Spotify playlist containing only the
                          filtered tracks.
                        </p>
                        <div className={styles.featureBenefit}>
                          <span className={styles.benefitIcon}>🎵</span>
                          <span>
                            Instantly create themed playlists like "High Energy Rock for Workouts"
                            or "Chill Indie for Study Sessions"
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.advancedSection}>
                    <h4 className={styles.advancedSectionTitle}>⚡ Bulk Tagging Workflows</h4>

                    <div className={styles.advancedFeature}>
                      <div className={styles.advancedFeatureContent}>
                        <h5>Single Track Tagging</h5>
                        <p>
                          Right-click any track in any Spotify playlist and select "Tag with Tagify"
                          to quickly add it to your tagged library.
                        </p>
                      </div>
                    </div>

                    <div className={styles.advancedFeature}>
                      <div className={styles.advancedFeatureContent}>
                        <h5>Mass Tagging Operations</h5>
                        <div className={styles.massTaggingSteps}>
                          <div className={styles.massTaggingStep}>
                            <span className={styles.stepIcon}>1️⃣</span>
                            <span>Select multiple tracks (Ctrl/Cmd + Click or Shift + Click)</span>
                          </div>
                          <div className={styles.massTaggingStep}>
                            <span className={styles.stepIcon}>2️⃣</span>
                            <span>Or use Ctrl/Cmd + A to select an entire playlist</span>
                          </div>
                          <div className={styles.massTaggingStep}>
                            <span className={styles.stepIcon}>3️⃣</span>
                            <span>Right-click and choose "Tag with Tagify"</span>
                          </div>
                          <div className={styles.massTaggingStep}>
                            <span className={styles.stepIcon}>4️⃣</span>
                            <span>Apply tags to all selected tracks simultaneously</span>
                          </div>
                        </div>
                        <div className={styles.featureBenefit}>
                          <span className={styles.benefitIcon}>⚡</span>
                          <span>
                            Tag entire albums or playlists with genre/mood tags in seconds instead
                            of track-by-track
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.proTip}>
                    <div className={styles.proTipIcon}>🚀</div>
                    <div className={styles.proTipContent}>
                      <strong>Pro Workflow:</strong> Create a "To Tag" playlist in Spotify, add
                      songs throughout the week, then use Ctrl+A → "Tag with Tagify" to batch
                      process them all at once during your weekly music organization session!
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <div className={styles.footerContent}>
              <div className={styles.footerInfo}>
                <span className={styles.version}>Tagify v1.0.0</span>
                <span className={styles.divider}>•</span>
                <span className={styles.love}>Made with ❤️ for music lovers</span>
                <a
                  href="https://github.com/alexk218/tagify"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Give it a star :)"
                  className={styles.githubLink}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 98 96"
                    fill="currentColor"
                    aria-hidden="true"
                    focusable="false"
                    role="img"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
                      fill="#fff"
                    />
                  </svg>
                </a>
              </div>
              <button className={styles.primaryButton} onClick={onClose}>
                Start Tagging!
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default InfoModal;

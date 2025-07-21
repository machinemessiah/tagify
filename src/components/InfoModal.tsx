import React, { useState } from "react";
import Portal from "../utils/Portal";
import styles from "./InfoModal.module.css";
import packageJson from "../../package.json";

interface InfoModalProps {
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", title: "Overview", icon: "📖" },
    { id: "getting-started", title: "Getting Started", icon: "🚀" },
    { id: "tagging", title: "Tagging System", icon: "🏷️" },
    { id: "features", title: "Features", icon: "⭐" },
  ];

  return (
    <Portal>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>
              <span className={styles.titleIcon}>🏷️</span>
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
                  <h3 className={styles.sectionTitle}>Welcome to Tagify!</h3>
                  <p className={styles.text}>
                    Tagify is a powerful music organization tool that transforms how you manage your
                    Spotify library.
                    <br />
                    Tag your tracks with a star rating, energy rating, and your own custom tags.
                    <br />
                    Create playlists by filtering your tagged tracks based on your own custom tags.
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
                          Play any song in Spotify, or use the context menu (right-click) "Tag with
                          Tagify" on any track to begin tagging.
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
                        <h4>Filter & Create Playlists</h4>
                        <p>
                          Use the Track List to see all your tagged music and experiment with
                          filters to create playlists based on your tags.
                        </p>
                      </div>
                    </div>

                    <div className={styles.step}>
                      <div className={styles.stepNumber}>5</div>
                      <div className={styles.stepContent}>
                        <h4>Create Custom Tags</h4>
                        <p>Press "Manage Tags" to create your own custom tags!</p>
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
                    Customize your entire tag system in "Manage Tags"!
                  </div>
                </div>
              )}

              {activeSection === "features" && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>How to Use Tagify</h3>

                  <div className={styles.featuresCompact}>
                    {/* 1. Create/Manage Tags */}
                    <div className={styles.featureItem}>
                      <div className={styles.featureHeader}>
                        <span className={styles.featureIcon}>🏷️</span>
                        <h4>1. Create & Manage Tags</h4>
                      </div>
                      <p>
                        Click <strong>"Manage Tags"</strong> to build your custom tagging system.
                        Create categories (e.g., "Mood"), subcategories (e.g., "Happy"), and
                        individual tags (e.g., "Upbeat"). This forms the foundation of your music
                        organization.
                      </p>
                    </div>

                    {/* 2. Apply ratings, energy, and tags */}
                    <div className={styles.featureItem}>
                      <div className={styles.featureHeader}>
                        <span className={styles.featureIcon}>⭐</span>
                        <h4>2. Rate, Tag & Set Energy</h4>
                      </div>
                      <p>
                        For any track, set <strong>star ratings (1-5)</strong>,{" "}
                        <strong>energy levels (1-10)</strong>, and apply your custom tags. Use the
                        tag selector interface to quickly tag tracks by mood, genre, activity, or
                        any system you create.
                      </p>
                    </div>

                    {/* 3. Update BPM */}
                    <div className={styles.featureItem}>
                      <div className={styles.featureHeader}>
                        <span className={styles.featureIcon}>🎵</span>
                        <h4>3. BPM Management</h4>
                      </div>
                      <p>
                        Sometimes Spotify doesn't get the BPM right...
                        <br />
                        Click any BPM value to edit manually, or use the refresh button (↻) to fetch
                        updated BPM from Spotify's audio analysis. Perfect for creating
                        tempo-specific playlists.
                      </p>
                    </div>

                    {/* 4. Lock tracks */}
                    <div className={styles.featureItem}>
                      <div className={styles.featureHeader}>
                        <span className={styles.featureIcon}>🔒</span>
                        <h4>4. Track Locking</h4>
                      </div>
                      <p>
                        Lock to a specific track to prevent automatic switching when Spotify changes
                        songs. Essential for focused tagging sessions without interruption.
                      </p>
                    </div>

                    {/* 5. Mass tagging */}
                    <div className={styles.featureItem}>
                      <div className={styles.featureHeader}>
                        <span className={styles.featureIcon}>📦</span>
                        <h4>5. Batch Tagging</h4>
                      </div>
                      <p>
                        Select multiple tracks in any Spotify playlist (Ctrl+A for all),
                        right-click, and choose
                        <strong>"Tag with Tagify"</strong> to tag them simultaneously.
                      </p>
                    </div>

                    {/* 6. Import/Export */}
                    <div className={styles.featureItem}>
                      <div className={styles.featureHeader}>
                        <span className={styles.featureIcon}>💾</span>
                        <h4>6. Import & Export Data</h4>
                      </div>
                      <p>
                        <strong>Export:</strong> Download your complete tag library as JSON backup.
                        <br />
                        <strong>Import:</strong> Click import button and select your backup file to
                        restore all tags, ratings, and metadata. Perfect for sharing libraries or
                        device migration.
                        <br />
                        Tip: Backup your data before doing any major operation - like deleting
                        entire tag categories, etc.
                      </p>
                    </div>

                    {/* 7. Smart filtering + playlist creation */}
                    <div className={styles.featureItem}>
                      <div className={styles.featureHeader}>
                        <span className={styles.featureIcon}>🔍</span>
                        <h4>7. Smart Filtering & Playlist Creation</h4>
                      </div>
                      <p>
                        Filter by any combination of tags (include/exclude), ratings, energy levels,
                        and BPM ranges.
                        <br />
                        Click tags once for <span className={styles.includeTag}>include</span>,
                        twice for
                        <span className={styles.excludeTag}>exclude</span>.
                        <br />
                        <strong>Filter Logic:</strong>{" "}
                        <span className={styles.filterMode}>ALL</span> = tracks must have ALL
                        selected tags, <span className={styles.filterMode}>ANY</span> = tracks need
                        at least ONE selected tag.
                        <br />
                        Then click <strong>"Create Playlist"</strong>
                        or <strong>"Play All"</strong> to enjoy your filtered results.
                      </p>
                    </div>

                    {/* 8. Tracklist/playbar icons */}
                    <div className={styles.featureItem}>
                      <div className={styles.featureHeader}>
                        <span className={styles.featureIcon}>🎯</span>
                        <h4>8. Visual Tag Indicators</h4>
                      </div>
                      <div className={styles.indicatorDemo}>
                        <p>Track status indicators appear in playlists and the playbar:</p>
                        <div className={styles.indicatorExamples}>
                          <div className={styles.indicatorExample}>
                            <span className={styles.orangeBullet}>●</span>
                            <span>Orange = Missing tags (needs attention)</span>
                          </div>
                          <div className={styles.indicatorExample}>
                            <span className={styles.greenBullet}>●</span>
                            <span>Green = Fully tagged (complete)</span>
                          </div>
                        </div>
                        <p className={styles.indicatorTip}>
                          <strong>Click</strong> any indicator to tag that track instantly.
                          <br />
                          <strong>Hover</strong> to see current tags.
                          <br />
                          You can disable both tracklist & playbar indicators in settings.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <div className={styles.footerContent}>
              <div className={styles.footerInfo}>
                <span className={styles.version}>Tagify v{packageJson.version}</span>
                <span className={styles.divider}>•</span>
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

import React, { useState } from "react";
import Portal from "../utils/Portal";
import styles from "./InfoModal.module.css";
import packageJson from "../../package.json";

interface InfoModalProps {
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState("whats-new");

  const sections = [
    { id: "whats-new", title: "What's New", icon: "👀" },
    { id: "overview", title: "Overview", icon: "📖" },
    { id: "getting-started", title: "Getting Started", icon: "👶" },
    { id: "tagging", title: "Tagging System", icon: "🏷️" },
    { id: "features", title: "Features", icon: "⭐" },
    { id: "roadmap", title: "What's Coming", icon: "🚀" },
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
                    } ${section.id === "whats-new" ? styles.whatsNewButton : ""}`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <span className={styles.navIcon}>{section.icon}</span>
                    <span className={styles.navText}>{section.title}</span>
                    {section.id === "whats-new" && <span className={styles.newIndicator}>NEW</span>}
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
                      <h4>Custom Tagging</h4>
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
                      <div className={styles.featureIcon}>🧠</div>
                      <h4>Smart Playlists</h4>
                      <p>Automatically sync tracks to playlists based on your tags and criteria</p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "whats-new" && (
                <div className={styles.section}>
                  <div className={styles.whatsNewHeader}>
                    <h3 className={styles.sectionTitle}>What's New in Tagify 2.0.0</h3>
                    <div className={styles.versionBadge}>v{packageJson.version}</div>
                  </div>

                  {/* Smart Playlists Feature */}
                  <div className={styles.featureGroup}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureIcon}>🧠</span>
                      <h4 className={styles.featureTitle}>Smart Playlists</h4>
                      <span className={styles.newBadge}>NEW</span>
                    </div>
                    <p className={styles.featureDescription}>
                      Create playlists that automatically stay up-to-date. Set your criteria once,
                      and every track you tag that matches will be <strong>instantly added</strong>{" "}
                      - no manual playlist management ever again.
                    </p>

                    {/* Visual Tutorial */}
                    <div className={styles.visualTutorial}>
                      <h5 className={styles.tutorialSubheading}>See It In Action:</h5>

                      {/* Step 1: Creating Smart Playlist */}
                      <div className={styles.tutorialStep}>
                        <div className={styles.stepInfo}>
                          <div className={styles.stepBadge}>Step 1</div>
                          <div className={styles.stepDetails}>
                            <h6 className={styles.stepTitle}>Define Your Smart Playlist</h6>
                            <p className={styles.stepDesc}>
                              Choose your filters: star ratings, custom tags, energy levels, or BPM
                              ranges. <br />
                              This example uses <strong>5 star</strong> tracks tagged{" "}
                              <strong>Disco</strong>.
                            </p>
                          </div>
                        </div>
                        <div className={styles.gifContainer}>
                          <img
                            src="https://raw.githubusercontent.com/alexk218/tagify/main/src/assets/CREATING_SMART_PLAYLIST.gif"
                            alt="Creating a smart playlist with 5 star rating and Disco tag criteria"
                            className={styles.tutorialGif}
                            loading="lazy"
                          />
                          <div className={styles.gifCaption}>
                            Defining the rules for automatic playlist management
                          </div>
                        </div>
                      </div>

                      {/* Step 2: Automatic Addition */}
                      <div className={styles.tutorialStep}>
                        <div className={styles.stepInfo}>
                          <div className={styles.stepBadge}>Step 2</div>
                          <div className={styles.stepDetails}>
                            <h6 className={styles.stepTitle}>Watch the Magic Happen</h6>
                            <p className={styles.stepDesc}>
                              Now, when tagging any track with <strong>5 stars</strong> and the{" "}
                              <strong>Disco</strong> tag - it jumps into your playlist
                              automatically. No manual work required!
                            </p>
                          </div>
                        </div>
                        <div className={styles.gifContainer}>
                          <img
                            src="https://raw.githubusercontent.com/alexk218/tagify/main/src/assets/SATISFYING_SMART_CRITERIA.gif"
                            alt="Tagging a track that automatically gets added to the smart playlist"
                            className={styles.tutorialGif}
                            loading="lazy"
                          />
                          <div className={styles.gifCaption}>
                            Track automatically added when criteria are satisfied
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bug Fixes */}
                  <div className={styles.featureGroup}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureIcon}>🐛</span>
                      <h4 className={styles.featureTitle}>Bug Fixes</h4>
                    </div>
                    <div className={styles.bugFixList}>
                      <div className={styles.bugFix}>
                        <span className={styles.bugFixIcon}>🔒</span>
                        <div>
                          <strong>Lock state persistence:</strong> Fixed issue where lock state
                          didn't persist after exiting the app
                        </div>
                      </div>
                      <div className={styles.bugFix}>
                        <span className={styles.bugFixIcon}>⚡</span>
                        <div>
                          <strong>Instant tag application:</strong> Tags are now applied immediately
                          - no more waiting or losing changes when quickly leaving the app
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Improvements */}
                  <div className={styles.featureGroup}>
                    <div className={styles.featureHeader}>
                      <span className={styles.featureIcon}>✨</span>
                      <h4 className={styles.featureTitle}>Improvements</h4>
                    </div>
                    <div className={styles.improvementList}>
                      <div className={styles.improvement}>
                        <span className={styles.improvementIcon}>💅</span>
                        <div>
                          <strong>Visual enhancements:</strong> Tagify is prettier
                        </div>
                      </div>
                      <div className={styles.improvement}>
                        <span className={styles.improvementIcon}>📊</span>
                        <div>
                          <strong>Real-time tracklist updates:</strong> Fixed persistent orange
                          bullets for empty tracks. The tracklist column extension now shows
                          accurate, up-to-date tag data
                        </div>
                      </div>
                      <div className={styles.improvement}>
                        <span className={styles.improvementIcon}>🎵</span>
                        <div>
                          <strong>Live playbar updates:</strong> Playbar enhancer now updates in
                          real-time based on track tags, ratings, and energy. No more page refreshes
                          needed!
                        </div>
                      </div>
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

                    {/* 5. Bulk tagging */}
                    <div className={styles.featureItem}>
                      <div className={styles.featureHeader}>
                        <span className={styles.featureIcon}>📦</span>
                        <h4>5. Bulk Tagging</h4>
                      </div>
                      <p>
                        Select multiple tracks in any Spotify playlist (Ctrl+A for all),
                        right-click, and choose
                        <strong>"Bulk Tag"</strong> to tag them simultaneously.
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

              {activeSection === "roadmap" && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>What's Coming Next...</h3>
                  <p className={styles.text}>Here's what's planned for future releases:</p>

                  {/* Upcoming Features */}
                  <div className={styles.roadmapList}>
                    <div className={styles.roadmapItem}>
                      <div className={styles.roadmapHeader}>
                        <span className={styles.roadmapIcon}>⭐</span>
                        <h4 className={styles.roadmapTitle}>Bulk Ratings & Energy</h4>
                        <span className={styles.comingSoonBadge}>Coming Soon</span>
                      </div>
                      <p className={styles.roadmapDescription}>
                        Apply star ratings and energy ratings in bulk within the bulk tagging menu.
                        Perfect for quickly organizing large collections of tracks.
                      </p>
                    </div>

                    <div className={styles.roadmapItem}>
                      <div className={styles.roadmapHeader}>
                        <span className={styles.roadmapIcon}>🎧</span>
                        <h4 className={styles.roadmapTitle}>Rekordbox Integration</h4>
                        <span className={styles.plannedBadge}>Planned</span>
                      </div>
                      <p className={styles.roadmapDescription}>
                        Sync your tags and star ratings between rekordbox and Tagify.
                      </p>
                    </div>

                    <div className={styles.roadmapItem}>
                      <div className={styles.roadmapHeader}>
                        <span className={styles.roadmapIcon}>⬇️</span>
                        <h4 className={styles.roadmapTitle}>Download Tracks</h4>
                        <span className={styles.plannedBadge}>Planned</span>
                      </div>
                      <p className={styles.roadmapDescription}>
                        Download tracks directly within Spotify for offline organization!
                      </p>
                    </div>
                  </div>

                  {/* Community Section */}
                  <div className={styles.communitySection}>
                    <div className={styles.communityHeader}>
                      <span className={styles.communityIcon}>💬</span>
                      <h4 className={styles.communityTitle}>Join the Community</h4>
                    </div>
                    <p className={styles.communityDescription}>
                      Want to influence Tagify's development? Join our GitHub Discussions to:
                    </p>
                    <div className={styles.communityFeatures}>
                      <div className={styles.communityFeature}>
                        <span className={styles.featureCheckmark}>✓</span>
                        <span>See the detailed roadmap</span>
                      </div>
                      <div className={styles.communityFeature}>
                        <span className={styles.featureCheckmark}>✓</span>
                        <span>Post ideas & feature requests</span>
                      </div>
                      <div className={styles.communityFeature}>
                        <span className={styles.featureCheckmark}>✓</span>
                        <span>Vote on which features you want most</span>
                      </div>
                    </div>
                    <div className={styles.communityAction}>
                      <a
                        href="https://github.com/alexk218/tagify/discussions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.discussionsLink}
                      >
                        <span className={styles.discussionsIcon}>🗨️</span>
                        Visit GitHub Discussions
                        <span className={styles.externalLinkIcon}>↗</span>
                      </a>
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

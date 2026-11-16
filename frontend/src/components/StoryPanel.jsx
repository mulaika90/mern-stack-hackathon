import Brand from "./Brand.jsx";

export default function StoryPanel() {
  return (
    <section className="story-panel" aria-label="About Serein">
      <Brand />

      <div className="story-copy">
        <span className="eyebrow">
          <span className="eyebrow-dot" />
          A calmer kind of space
        </span>
        <h1>
          Make room for
          <br />
          what <span>moves you.</span>
        </h1>
        <p>
          Your ideas, your people, your next big thing. Find a little more
          clarity in the everyday.
        </p>
      </div>

      <div className="quote-card">
        <div className="quote-stars" aria-label="5 out of 5 stars">
          ★★★★★
        </div>
        <blockquote>
          “The best things happen when everything finally has a place.”
        </blockquote>
        <div className="quote-author">
          <span className="avatar" aria-hidden="true">
            M
          </span>
          <span>
            <strong>Morgan Lee</strong>
            <small>Member since 2023</small>
          </span>
        </div>
      </div>

      <div className="story-footer">
        <span>Thoughtfully made for your everyday.</span>
        <span className="footer-spark" aria-hidden="true">
          ✳
        </span>
      </div>
    </section>
  );
}

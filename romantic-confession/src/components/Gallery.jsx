import { useMemo } from "react";
import { stories } from "../data/stories.js";
import { LoopIcon, SparkleIcon } from "./Icons.jsx";
import StoryCard from "./StoryCard.jsx";

export default function Gallery({ onOpen, finePointer, suspended }) {
  const chapterWord = useMemo(
    () => ["one", "two", "three", "four", "five", "six", "seven", "eight"],
    [],
  );

  return (
    <section className="chapters section" id="chapters" aria-labelledby="chapters-title">
      <div className="section-heading reveal">
        <div>
          <p className="section-kicker">
            <span aria-hidden="true">✦</span>
            the eight chapters
          </p>
          <h2 id="chapters-title" className="section-title">
            Little films, <em>big feelings.</em>
          </h2>
        </div>
        <p className="section-lede">
          Eight moments I kept because they felt like you. Each one has its own words,
          written only for that memory. Open them in any order — or let them unfold
          one by one.
        </p>
      </div>

      <div className="chapter-rail reveal" aria-hidden="true">
        {stories.map((story, index) => (
          <span className="chapter-rail-item" key={story.id}>
            <span className="chapter-rail-number">{story.number}</span>
            <span className="chapter-rail-word">{chapterWord[index]}</span>
          </span>
        ))}
      </div>

      <div className="story-grid">
        {stories.map((story, index) => (
          <StoryCard
            key={story.id}
            story={story}
            index={index}
            onOpen={onOpen}
            finePointer={finePointer}
            suspended={suspended}
          />
        ))}
      </div>

      <div className="chapters-footnote reveal">
        <span className="footnote-icon" aria-hidden="true">
          <LoopIcon size={15} />
        </span>
        <p>
          Every little film loops back to its beginning. Stay with a chapter for as long
          as it takes for the words to feel like yours.
        </p>
        <SparkleIcon size={11} />
      </div>
    </section>
  );
}

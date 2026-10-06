"use client";
import { useState } from "react";
import { PageFrame } from "@/components/PageFrame";
import { ReviewEditor } from "@/components/DailyReview";
import { useDailyReviews } from "@/components/DailyReviewProvider";
import { localDay } from "@/lib/life";
export default function DailyReviewPage() {
  const [day, setDay] = useState(localDay());
  const { reviews } = useDailyReviews();
  return (
    <PageFrame>
      <div className="calm-section-head">
        <div>
          <h1>Mon bilan quotidien</h1>
          <p>Académie, Islam, trading et formation, santé.</p>
        </div>
        <label>
          Journée
          <input
            type="date"
            required
            max={localDay()}
            value={day}
            onChange={(e) => {
              if (e.target.value) setDay(e.target.value);
            }}
          />
        </label>
      </div>
      <section className="neo-panel daily-review-page">
        <ReviewEditor key={day} day={day} />
      </section>
      <details className="calm-disclosure">
        <summary className="calm-disclosure-button">
          Mes bilans précédents
        </summary>
        <div className="calm-disclosure-content">
          {reviews.slice(0, 60).map((r) => (
            <button
              key={r.day}
              className="neo-pill"
              onClick={() => setDay(r.day)}
            >
              {new Date(r.day + "T12:00:00").toLocaleDateString("fr-FR")} ·{" "}
              {r.completed ? "Terminé" : "À reprendre"}
            </button>
          ))}
          {!reviews.length && <p>Ton premier bilan apparaîtra ici.</p>}
        </div>
      </details>
    </PageFrame>
  );
}

'use client';

import { ChevronLeft, ChevronRight, LockKeyhole } from 'lucide-react';
import { useMemo, useState } from 'react';
import styles from './retroville-episode-vault-slider.module.css';

type RetrovilleEpisodeVaultSliderProps = {
  slots: readonly string[];
};

function buildLockedEpisodeCopy(slot: string) {
  return {
    code: `EP ${slot}`,
    title: 'Contenido privado',
    body: 'El titulo, la sinopsis y los personajes implicados se entregan solo dentro del dossier editorial, manteniendo el ritmo de la temporada fuera de exposición pública.',
  };
}

export default function RetrovilleEpisodeVaultSlider({
  slots,
}: RetrovilleEpisodeVaultSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeEpisode = useMemo(() => buildLockedEpisodeCopy(slots[activeIndex] || '01'), [activeIndex, slots]);

  function goToIndex(index: number) {
    const safeIndex = ((index % slots.length) + slots.length) % slots.length;
    setActiveIndex(safeIndex);
  }

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <div className={styles.counter}>
          <p className={styles.eyebrow}>Slider privado</p>
          <h3 className={styles.title}>
            {String(activeIndex + 1).padStart(2, '0')} / {String(slots.length).padStart(2, '0')}
          </h3>
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.controlButton}
            aria-label="Ver episodio anterior"
            onClick={() => goToIndex(activeIndex - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={styles.controlButton}
            aria-label="Ver episodio siguiente"
            onClick={() => goToIndex(activeIndex + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className={styles.slotRail} aria-label="Selector de episodios privados">
        {slots.map((slot, index) => (
          <button
            key={slot}
            type="button"
            className={`${styles.slotButton} ${index === activeIndex ? styles.activeSlot : ''}`}
            aria-pressed={index === activeIndex}
            onClick={() => goToIndex(index)}
          >
            {slot}
          </button>
        ))}
      </div>

      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <p className={styles.code}>{activeEpisode.code}</p>
          <p className={styles.tag}>Reservado</p>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.iconWrap}>
            <LockKeyhole className="h-5 w-5" />
          </div>

          <div className={styles.cardCopy}>
            <h4 className={styles.episodeTitle}>{activeEpisode.title}</h4>
            <div className={styles.redactedStack} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p className={styles.body}>{activeEpisode.body}</p>
          </div>
        </div>
      </article>
    </div>
  );
}

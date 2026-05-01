/**
 * Yandex Maps Custom Layouts
 * Provides Avito-style HTML layouts for markers and clusters.
 * Optimized for Cyber Purple design system.
 */

export function createYandexLayouts(ymaps: any) {
  // 1. Custom Placemark Layout (Price Chip)
  // Uses data-status for different visual states (active, new, etc.)
  const PlacemarkLayout = ymaps.templateLayoutFactory.createClass(
    `
    <div class="placemark-layout">
      <div class="placemark-chip $[properties.activeStatus]">
        $[properties.budgetLabel]
      </div>
      <div class="placemark-pin"></div>
    </div>
    `
  );

  // 2. Custom Cluster Layout (Aggregated Info)
  // Displays count and minimum price in a premium capsule
  const ClusterLayout = ymaps.templateLayoutFactory.createClass(
    `
    <div class="cluster-layout">
      <div class="cluster-chip">
        <div class="cluster-count">
          <span>$[properties.geoObjects.length]</span>
        </div>
        <div class="cluster-price">
          <span class="text-[10px] opacity-70 uppercase mr-1">от</span>
          <span>$[properties.minPriceLabel]</span>
        </div>
      </div>
    </div>
    `
  );

  return { PlacemarkLayout, ClusterLayout };
}

/**
 * Premium Styles for the layouts.
 * These are injected into globals.css or can be used with a <style> tag.
 */
export const YANDEX_MAP_CSS = `
  /* Premium Placemark (Price Chip) */
  .placemark-layout {
    position: relative;
    transform: translate(-50%, -100%);
    cursor: pointer;
    user-select: none;
    z-index: 10;
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  .placemark-layout:hover {
    transform: translate(-50%, -105%) scale(1.05);
    z-index: 100;
  }

  .placemark-chip {
    background: #ffffff;
    color: #0f172a;
    border-radius: 12px;
    padding: 6px 12px;
    font-size: 14px;
    font-weight: 700;
    border: 1.5px solid rgba(0, 0, 0, 0.05);
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 60px;
  }
  
  /* Cyber Purple Active State */
  .placemark-chip.active {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 20px rgba(124, 58, 237, 0.4);
  }
  
  .placemark-pin {
    width: 0;
    height: 0;
    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-top: 7px solid #ffffff;
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .placemark-chip.active + .placemark-pin {
    border-top-color: #8b5cf6;
  }

  /* Premium Cluster Capsule */
  .cluster-layout {
    position: relative;
    transform: translate(-50%, -50%);
    cursor: pointer;
    z-index: 5;
    transition: transform 0.2s ease;
  }
  
  .cluster-layout:hover {
    transform: translate(-50%, -50%) scale(1.08);
  }

  .cluster-chip {
    background: #0f172a;
    color: white;
    border-radius: 24px;
    padding: 3px;
    padding-right: 14px;
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.1);
    white-space: nowrap;
  }

  .cluster-count {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    font-size: 13px;
    border: 2px solid #0f172a;
    box-shadow: inset 0 0 8px rgba(0,0,0,0.2);
  }

  .cluster-price {
    display: flex;
    align-items: baseline;
    letter-spacing: -0.01em;
  }
`;

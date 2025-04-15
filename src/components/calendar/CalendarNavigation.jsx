import React from 'react';

export const CalendarNavigation = ({
  selectedYear,
  currentView,
  currentWeekNumber,
  months,
  calendarRef,
  goToPreviousYear,
  goToNextYear,
  goToPreviousWeek,
  goToNextWeek,
  navigateToMonth,
  handleTodayClick
}) => {
  return (
    <div className="fc-custom-nav-container">
      <div className="fc-nav-row">
        {/* Navigation par année - Gauche */}
        <div className="fc-year-nav">
          <button
            type="button"
            className="fc-button fc-button-primary fc-prev-year-button"
            onClick={goToPreviousYear}
            title="Année précédente"
          >
            &laquo;
          </button>
          <span className="fc-year-display">{selectedYear}</span>
          <button
            type="button"
            className="fc-button fc-button-primary fc-next-year-button"
            onClick={goToNextYear}
            title="Année suivante"
          >
            &raquo;
          </button>
          <button
            type="button"
            className="fc-button fc-button-primary fc-today-button"
            onClick={handleTodayClick}
            title="Aujourd'hui"
          >
            Aujourd'hui
          </button>
        </div>

        {/* Centre - Mois (visible dans toutes les vues) */}
        <div className="fc-months-nav">
          {months.map((month, index) => (
            <button
              key={index}
              type="button"
              className="fc-button fc-button-primary fc-month-button"
              onClick={() => navigateToMonth(index)}
            >
              <span className="month-full">{month}</span>
              <span className="month-abbr">{month.substring(0, 3)}</span>
            </button>
          ))}
        </div>

        {/* Boutons de navigation de semaine - Visible uniquement en vue semaine */}
        {currentView === 'resourceTimelineWeek' && (
          <>
            <button
              type="button"
              className="fc-button fc-button-primary fc-prev-week-button"
              onClick={() => {
                goToPreviousWeek();
              }}
              title="Semaine précédente"
            >
              &lt;
            </button>

            {/* Affichage du numéro de semaine */}
            <span className="fc-week-display">Semaine {currentWeekNumber}</span>

            <button
              type="button"
              className="fc-button fc-button-primary fc-next-week-button"
              onClick={() => {
                goToNextWeek();
              }}
              title="Semaine suivante"
            >
              &gt;
            </button>
          </>
        )}

        {/* Droite - Boutons de vue du calendrier */}
        <div className="fc-view-buttons">
          <button
            type="button"
            className={`fc-button fc-button-primary ${currentView === 'resourceTimelineYear' ? 'fc-button-active' : ''}`}
            onClick={() => {
              if (calendarRef.current) {
                calendarRef.current.getApi().changeView('resourceTimelineYear');
              }
            }}
          >
            Année
          </button>
          <button
            type="button"
            className={`fc-button fc-button-primary ${currentView === 'resourceTimelineMonth' ? 'fc-button-active' : ''}`}
            onClick={() => {
              if (calendarRef.current) {
                calendarRef.current.getApi().changeView('resourceTimelineMonth');
              }
            }}
          >
            Mois
          </button>
          <button
            type="button"
            className={`fc-button fc-button-primary ${currentView === 'resourceTimelineWeek' ? 'fc-button-active' : ''}`}
            onClick={() => {
              if (calendarRef.current) {
                calendarRef.current.getApi().changeView('resourceTimelineWeek');
              }
            }}
          >
            Semaine
          </button>
        </div>
      </div>
    </div>
  );
};

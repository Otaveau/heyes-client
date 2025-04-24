import React from 'react';
import { useTheme } from '../../context/ThemeContext';

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
  useTheme(); // Récupération de l'état du mode sombre
  
  return (
    <div className="fc-custom-nav-container bg-gray-50 dark:bg-gray-800">
      <div className="fc-nav-row">
        {/* Navigation par année - Gauche */}
        <div className="fc-year-nav bg-gray-50 dark:bg-gray-900">
          <button
            type="button"
            className="fc-button fc-button-primary fc-prev-year-button"
            onClick={goToPreviousYear}
            title="Année précédente"
            aria-label="Année précédente"
          >
            &laquo;
          </button>
          <span className="fc-year-display text-gray-900 dark:text-gray-100">{selectedYear}</span>
          <button
            type="button"
            className="fc-button fc-button-primary fc-next-year-button"
            onClick={goToNextYear}
            title="Année suivante"
            aria-label="Année suivante"
          >
            &raquo;
          </button>
          <button
            type="button"
            className="fc-button fc-button-primary fc-today-button"
            onClick={handleTodayClick}
            title="Aujourd'hui"
            aria-label="Aujourd'hui"
          >
            Aujourd'hui
          </button>
        </div>

        {/* Centre - Mois (visible dans toutes les vues) */}
        <div className="fc-months-nav">
          {months.map((month, index) => {
            const isCurrentMonth = new Date().getMonth() === index && 
                                  new Date().getFullYear() === selectedYear;
            
            return (
              <button
                key={index}
                type="button"
                className={`fc-button fc-button-primary fc-month-button ${
                  isCurrentMonth ? 'fc-button-active' : ''
                }`}
                onClick={() => navigateToMonth(index)}
                aria-label={month}
              >
                <span className="month-full">{month}</span>
                <span className="month-abbr">{month.substring(0, 3)}</span>
              </button>
            );
          })}
        </div>

        {/* Boutons de navigation de semaine - Visible uniquement en vue semaine */}
        {currentView === 'resourceTimelineWeek' && (
          <div className="flex items-center bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded-md shadow-sm mx-1">
            <button
              type="button"
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md border border-gray-300 dark:border-gray-700 transition-all"
              onClick={goToPreviousWeek}
              title="Semaine précédente"
              aria-label="Semaine précédente"
            >
              &lt;
            </button>

            {/* Affichage du numéro de semaine */}
            <span className="font-semibold text-lg mx-2 text-blue-600 dark:text-blue-400">Semaine {currentWeekNumber}</span>

            <button
              type="button"
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-md border border-gray-300 dark:border-gray-700 transition-all"
              onClick={goToNextWeek}
              title="Semaine suivante"
              aria-label="Semaine suivante"
            >
              &gt;
            </button>
          </div>
        )}

        {/* Droite - Boutons de vue du calendrier */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded-md shadow-sm mx-1">
          <button
            type="button"
            className={`px-3 py-1 font-medium rounded-md border transition-all mr-1 ${
              currentView === 'resourceTimelineYear' 
                ? 'bg-blue-600 text-white border-blue-700' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-700'
            }`}
            onClick={() => {
              if (calendarRef.current) {
                calendarRef.current.getApi().changeView('resourceTimelineYear');
              }
            }}
            aria-label="Vue année"
            aria-pressed={currentView === 'resourceTimelineYear'}
          >
            Année
          </button>
          <button
            type="button"
            className={`px-3 py-1 font-medium rounded-md border transition-all mx-1 ${
              currentView === 'resourceTimelineMonth' 
                ? 'bg-blue-600 text-white border-blue-700' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-700'
            }`}
            onClick={() => {
              if (calendarRef.current) {
                calendarRef.current.getApi().changeView('resourceTimelineMonth');
              }
            }}
            aria-label="Vue mois"
            aria-pressed={currentView === 'resourceTimelineMonth'}
          >
            Mois
          </button>
          <button
            type="button"
            className={`px-3 py-1 font-medium rounded-md border transition-all ml-1 ${
              currentView === 'resourceTimelineWeek' 
                ? 'bg-blue-600 text-white border-blue-700' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-700'
            }`}
            onClick={() => {
              if (calendarRef.current) {
                calendarRef.current.getApi().changeView('resourceTimelineWeek');
              }
            }}
            aria-label="Vue semaine"
            aria-pressed={currentView === 'resourceTimelineWeek'}
          >
            Semaine
          </button>
        </div>
      </div>
    </div>
  );
};
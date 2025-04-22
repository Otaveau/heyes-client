import { adjustColor } from '../../utils/ColorUtils';

// Composant de rendu pour les tâches standards
export const TaskEventRenderer = ({ event, backgroundColor, textColor }) => {
  const darkerColor = adjustColor(backgroundColor, -15);
  
  // Calculer la durée de l'événement en jours
  const startDate = new Date(event.start);
  const endDate = event.end ? new Date(event.end) : new Date(startDate);
  const durationInDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const taskSizeClass = durationInDays > 5 ? 'long-task' : 'short-task';
  
  // Créer un dégradé léger pour donner de la profondeur à la tâche
  const gradientBg = `linear-gradient(to bottom, ${adjustColor(backgroundColor, 5)}, ${backgroundColor})`;
  const bgColorWithOpacity = adjustColor(backgroundColor, 0, 0.9);
  
  return `
    <div class="fc-event-main-custom ${taskSizeClass}" 
      style="background: ${gradientBg}; color: ${textColor}; border-left: 3px solid ${darkerColor};">
      
      <div class="task-title-container">
        <span class="task-title" style="background-color: ${bgColorWithOpacity};">
          ${event.title}
        </span>
      </div>
      
      <span class="task-title-duplicate">
        ${event.title}
      </span>
    </div>
  `;
};
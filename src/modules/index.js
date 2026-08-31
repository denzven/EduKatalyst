import { moduleRegistry } from '../core/ModuleRegistry';
import { ExplorerModuleDefinition } from './explorer/index.jsx';
import { VideoModuleDefinition } from './video/index.jsx';
import { NotesModuleDefinition } from './notes/index.jsx';
import { QuizModuleDefinition } from './quiz/index.jsx';

/**
 * Register all core EduKatalyst feature modules with the central ModuleRegistry.
 */
export function registerAllModules() {
  moduleRegistry.register(ExplorerModuleDefinition);
  moduleRegistry.register(VideoModuleDefinition);
  moduleRegistry.register(NotesModuleDefinition);
  moduleRegistry.register(QuizModuleDefinition);
}

export {
  ExplorerModuleDefinition,
  VideoModuleDefinition,
  NotesModuleDefinition,
  QuizModuleDefinition,
};

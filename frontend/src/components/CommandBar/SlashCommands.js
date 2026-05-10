export const SLASH_COMMANDS = [
  { command: 'task',      description: 'Create a task card in the current workspace',  usage: '/task Write tests for OCR module' },
  { command: 'note',      description: 'Create a markdown note card',                  usage: '/note Meeting notes' },
  { command: 'video',     description: 'Add a video card (auto-fetches YouTube info)',  usage: '/video https://youtube.com/...' },
  { command: 'snippet',   description: 'Save a code snippet card',                     usage: '/snippet Python regex helper' },
  { command: 'link',      description: 'Save a link card',                             usage: '/link Useful article title' },
  { command: 'find',      description: 'AI-powered search across all cards',           usage: '/find surya model' },
  { command: 'done',      description: 'Mark a card as done by partial name match',    usage: '/done surya' },
  { command: 'clip',      description: 'Save text directly to the clipboard',          usage: '/clip some text to save' },
  { command: 'summarize', description: 'Get an AI summary of the current workspace',   usage: '/summarize' },
  { command: 'stale',     description: 'List cards that haven\'t been touched in a while', usage: '/stale' },
];

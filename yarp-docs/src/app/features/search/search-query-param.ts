// The one thing shared between SearchDialog (which reads it to decide
// whether it's open) and every trigger that opens it (SiteHeader's search
// button/icon, SearchDialog's own Ctrl/Cmd+K handler) - a plain constant
// instead of a service, since both sides just need the same string to stay
// in sync, not any shared behavior.
export const SEARCH_QUERY_PARAM = 'search';

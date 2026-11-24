/* Shared message and language-rule lookup. The locale is fixed per game session. */
(function(root) {
    'use strict';
    const isNode = typeof module !== 'undefined' && module.exports;
    const catalogs = isNode ? {
        'pt-BR': require('../locales/pt-BR.json'), en: require('../locales/en.json')
    } : root.GameLocales;
    const requested = isNode ? process.env.GAME_LANGUAGE : root.location.hash.slice(1);
    const language = requested === 'en' ? 'en' : 'pt-BR';
    const catalog = catalogs[language];
    function t(key) {
        if (!Object.hasOwn(catalog.messages, key)) throw new Error(`Missing translation: ${key}`);
        return catalog.messages[key];
    }
    function regex(key) {
        const rule = catalog.rules[key];
        if (!rule) throw new Error(`Missing language rule: ${key}`);
        return new RegExp(rule.source, rule.flags);
    }
    const api = { language, t, regex };
    if (isNode) module.exports = api;
    else root.Localization = api;
})(typeof window !== 'undefined' ? window : globalThis);

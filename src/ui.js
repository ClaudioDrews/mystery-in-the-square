/* Browser UI, persistence, controls and OpenRouter integration. */
{
    const { t: L, regex: R, language } = window.Localization;
    const E = window.Engine, { Game, nm } = window.GameAPI;
    const { NPCS, NPC_INFO, NODES, MAP, W, H, QUADS, QUAD_NAMES } = E;
    const $ = id => document.getElementById(id);
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const store = { get(k) { try {
            return localStorage.getItem(k);
        }
        catch (e) {
            return null;
        } }, set(k, v) { try {
            localStorage.setItem(k, v);
        }
        catch (e) { } }, del(k) { try {
            localStorage.removeItem(k);
        }
        catch (e) { } } };
    const TITLE = L("ui.title_art");
    const PORTRAIT = {
        bento: [' _______ ', '|_______|', ' (o   o) ', '  \\ ~ /  ', ' ~|||||~ '],
        fiscal: ['  .---.  ', ' ( o o ) ', '  \\ - /  ', ' [|###|] ', '  |_|_|  '],
        tereza: ['  .~~~.  ', ' ( ^ ^ ) ', '  \\ o /  ', '  /|T|\\  ', '  _/ \\_  '],
        guri: ['   ___   ', '  (* *)  ', '  ( - )  ', '  /|U|\\~ ', '   / \\   '],
        leitor: ['  _____  ', ' [o]-[o] ', '   \\_/   ', ' |=NEWS=|', ' |______|'],
        lu: ['  ,~~~,  ', ' ((o o)) ', '  )\\-/(  ', ' /=|=|=\\ ', '  ~ ~ ~  '],
        null: ['   ___   ', '  /   \\  ', ' |  ?  | ', '  \\___/  ', '         '],
    };
    const EMOJI = { me: '🕵️', dog: '🐕', lu: '🕵️‍♀️', fiscal: '👮', bento: '👴🏾', tereza: '👵🏻', guri: '👦🏻', leitor: '👳‍♂️' };
    let game, cfg = { key: store.get('mp_key') || '', model: store.get('mp_model') || 'openrouter/free' };
    let mode = 'mvp', curSeed = null, aiState = 'off', logLines = [];
    const ui = {
        log(t, cls) { logLines.push({ t, cls: cls || '' }); if (logLines.length > 120)
            logLines.shift(); renderLog(); },
        dialog(d) { openDialog(d); },
        closeDialog() { const was = $('dlg').classList.contains('on'); $('dlg').classList.remove('on'); $('log').style.display = ''; $('controls').style.display = ''; if (was) {
            fitMap();
            render();
        } },
        update() { render(); },
        end(r) { showEnd(r); },
        freeAsk(x) { freeAsk(x); },
    };
    let lastAIError = '', aiCalls = 0, aiCooldownUntil = 0;
    const LIB_KEY = language === 'en' ? 'mp_cases_v16_en' : 'mp_cases_v13', REPLAY_KEY = language === 'en' ? 'mp_replay_v16_en' : 'mp_replay_v13', LIB_LIMIT = 100;
    function readJSON(k, fb) { try {
        return JSON.parse(store.get(k)) ?? fb;
    }
    catch {
        return fb;
    } }
    function loadLibrary() { const a = readJSON(LIB_KEY, []); if (!Array.isArray(a))
        return []; const out = []; for (const z of a.slice(0, LIB_LIMIT)) {
        try {
            const c = E.parseCase(z);
            if (!out.some(o => o.id === c.id))
                out.push(c);
        }
        catch { }
    } return out; }
    let extraCases = loadLibrary(), replayMap = readJSON(REPLAY_KEY, {});
    if (!replayMap || typeof replayMap !== 'object' || Array.isArray(replayMap))
        replayMap = {};
    replayMap = Object.fromEntries(Object.entries(replayMap).map(([key,id]) => [key.replace(/^avancado:/,'advanced:'), id]));
    const allCases = () => [...E.CASES, ...extraCases];
    const getCase = id => allCases().find(c => c.id === id) || null;
    function rememberReplay(w) { const key = w.mode + ':' + w.seed; delete replayMap[key]; replayMap[key] = w.scenario.id; const entries = Object.entries(replayMap).slice(-300); replayMap = Object.fromEntries(entries); store.set(REPLAY_KEY, JSON.stringify(replayMap)); }
    function saveLibrary() { const json = JSON.stringify(extraCases.map(c => c.source)); store.set(LIB_KEY, json); return store.get(LIB_KEY) === json; }
    let libCtl = null, libStatus = '', epCtl = null, endState = null;
    function abortNarrative() { if (libCtl) {
        libCtl.abort();
        libCtl = null;
    } if (epCtl) {
        epCtl.abort();
        epCtl = null;
    } }
    async function narrativeRequest(sys, payload, ctl, timeout, tokens) {
        if (!cfg.key)
            throw Error(L("ui.configure_the_openrouter_key_first_1900"));
        if (aiCalls >= 25)
            throw Error(L("ui.request_limit_for_this_game_reached_1901"));
        if (Date.now() < aiCooldownUntil)
            throw Error(L("ui.temporary_openrouter_limit_try_again_later_1902"));
        const to = setTimeout(() => ctl.abort(), timeout);
        aiCalls++;
        try {
            const r = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', signal: ctl.signal, headers: { Authorization: 'Bearer ' + cfg.key, 'Content-Type': 'application/json', 'X-Title': 'Misterio na Praca' }, body: JSON.stringify({ model: cfg.model || 'openrouter/free', temperature: .85, max_tokens: tokens, messages: [{ role: 'system', content: sys }, { role: 'user', content: JSON.stringify(payload) }] }) });
            if (!r.ok) {
                if (r.status === 429)
                    aiCooldownUntil = Date.now() + 60000;
                throw Error('HTTP ' + r.status);
            }
            const j = await r.json();
            return String(j.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '');
        }
        finally {
            clearTimeout(to);
        }
    }
    function renderLibrary() {
        $('libStatus').textContent = libStatus || `${E.CASES.length}${L("ui.originals_1918")}${extraCases.length}${L("ui.generated_in_this_browser_1919")}`;
        $('libGenerate').disabled = !!libCtl || extraCases.length >= LIB_LIMIT;
        $('libCancel').hidden = !libCtl;
        $('libRandom').disabled = !!libCtl;
        $('libExport').disabled = !!libCtl || !extraCases.length;
        $('libImport').disabled = !!libCtl || extraCases.length >= LIB_LIMIT;
        $('libList').innerHTML = allCases().slice().reverse().map(c => `<div class="card"><div class="m">${c.source ? L("ui.ai_generated_1927") : 'ORIGINAL'} · ${esc(c.id)}</div><b>${esc(c.title)}</b><p>${esc(c.context)}</p><button data-case="${esc(c.id)}" ${libCtl ? 'disabled' : ''}${L("ui.new_game_with_this_case_1936")}${c.source ? `<button data-remove="${esc(c.id)}" ${libCtl ? 'disabled' : ''}${L("ui.class_note_remove_from_library_1941")}` : ''}</div>`).join('');
    }
    function openLibrary() { stopMove(); if (game?.busy)
        return; libStatus = ''; $('ovLibrary').classList.add('on'); renderLibrary(); $('ovLibrary').querySelector('.body').scrollTop = 0; }
    function closeLibrary() { if (libCtl) {
        libCtl.abort();
        libCtl = null;
    } $('ovLibrary').classList.remove('on'); }
    async function generateStory() {
        if (libCtl || extraCases.length >= LIB_LIMIT)
            return;
        if (!cfg.key) {
            libStatus = L("ui.configure_your_key_in_ai_config_before_generating_exis_1952");
            renderLibrary();
            return;
        }
        const ctl = new AbortController();
        libCtl = ctl;
        libStatus = L("ui.creating_a_new_story_the_engine_will_verify_its_struct_1953");
        renderLibrary();
        try {
            const sys = `${L("ui.create_one_original_fictional_detective_case_for_a_gam_1954")}${E.CASE_RESERVED.join(', ')}${L("ui.no_field_may_describe_any_suspect_s_occupation_origin__1956")}${E.CASE_AVOID_TEXT}${L("ui.return_only_json_with_these_exact_keys_title_victim_oc_1957")}`;
            const raw = await narrativeRequest(sys, { existingTitles: allCases().map(c => c.title).slice(-40), variation: E.timeSelection(new Date()).seed }, ctl, 25000, 1800);
            if (libCtl !== ctl || ctl.signal.aborted)
                return;
            const c = E.parseCase(raw);
            if (allCases().some(o => o.id === c.id || o.title.toLocaleLowerCase(language) === c.title.toLocaleLowerCase(language)))
                throw Error(L("ui.duplicate_case_generate_another_story_1960"));
            const seed = E.timeSelection(new Date()).seed;
            for (const m of ['mvp', "advanced"]) {
                const test = new Game({ log() { }, update() { }, dialog() { }, closeDialog() { }, end() { } });
                test.start(seed, m, null, c.id, c);
            }
            if (libCtl !== ctl)
                return;
            extraCases.push(c);
            const saved = saveLibrary();
            libStatus = `${L("ui.new_case_1963")}${c.title}${L("ui.verified_in_both_modes_1964")}${saved ? L("ui.saved_for_offline_play_1965") : L("ui.storage_unavailable_available_only_in_this_session_1966")}`;
        }
        catch (e) {
            if (libCtl === ctl)
                libStatus = ctl.signal.aborted ? L("ui.generation_cancelled_or_timed_out_your_library_has_not_1968") : `${L("ui.could_not_generate_1969")}${String(e.message || e)}${L("ui.your_library_has_not_changed_1970")}`;
        }
        finally {
            if (libCtl === ctl) {
                libCtl = null;
                renderLibrary();
            }
        }
    }
    $('bLibrary').onclick = $('bLibraryCfg').onclick = $('bLibraryEnd').onclick = openLibrary;
    $('libClose').onclick = closeLibrary;
    $('libGenerate').onclick = generateStory;
    $('libCancel').onclick = () => { if (libCtl)
        libCtl.abort(); libCtl = null; libStatus = L("ui.generation_cancelled_1977"); renderLibrary(); };
    $('libRandom').onclick = () => { if (!libCtl) {
        closeLibrary();
        newGame();
    } };
    $('libList').onclick = e => { if (libCtl)
        return; const rem = e.target.closest('[data-remove]'); if (rem) {
        const c = extraCases.find(z => z.id === rem.dataset.remove);
        if (c && confirm(`${L("ui.remove_1981")}${c.title}${L("ui.from_the_local_library_saved_seeds_for_this_case_may_s_1982")}`)) {
            extraCases = extraCases.filter(z => z.id !== c.id);
            libStatus = saveLibrary() ? L("ui.case_removed_1983") : L("ui.case_removed_for_this_session_storage_unavailable_1984");
            renderLibrary();
        }
        return;
    } const b = e.target.closest('[data-case]'); if (!b)
        return; const c = getCase(b.dataset.case); if (c) {
        closeLibrary();
        newGame(undefined, c);
    } };
    $('libExport').onclick = () => { if (libCtl || !extraCases.length)
        return; const blob = new Blob([JSON.stringify({ format: 'misterio-na-praca-cases-v13', language, cases: extraCases.map(c => c.source), replays: Object.fromEntries(Object.entries(replayMap).filter(([k, id]) => extraCases.some(c => c.id === id))) }, null, 2)], { type: 'application/json' }); const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = 'misterio-na-praca-library-' + language + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); };
    $('libImport').onclick = () => { if (!libCtl)
        $('libFile').click(); };
    $('libFile').onchange = async () => {
        const file = $('libFile').files?.[0];
        $('libFile').value = '';
        if (!file || libCtl)
            return;
        try {
            if (file.size > 1500000)
                throw Error(L("ui.file_too_large_1997"));
            const z = JSON.parse(await file.text());
            if (z?.format !== 'misterio-na-praca-cases-v13' || !Array.isArray(z.cases) || z.cases.length > LIB_LIMIT)
                throw Error(L("ui.invalid_backup_format_1999"));
            if ((z.language || 'pt-BR') !== language) throw Error(L('ui.backup_language_mismatch'));
            let valid = [], duplicates = 0, invalid = 0;
            for (const raw of z.cases) {
                try {
                    const c = E.parseCase(raw);
                    if ([...allCases(), ...valid].some(o => o.id === c.id || o.title.toLocaleLowerCase(language) === c.title.toLocaleLowerCase(language))) {
                        duplicates++;
                        continue;
                    }
                    if (extraCases.length + valid.length >= LIB_LIMIT)
                        break;
                    valid.push(c);
                }
                catch {
                    invalid++;
                }
            }
            if (!$('ovLibrary').classList.contains('on') || libCtl)
                return;
            extraCases.push(...valid);
            if (z.replays && typeof z.replays === 'object' && !Array.isArray(z.replays))
                for (const [legacyKey, id] of Object.entries(z.replays).slice(-300)) {
                    const k = legacyKey.replace(/^avancado:/,'advanced:');
                    if (!/^(mvp|advanced):\d{1,10}$/.test(k) || Number(k.split(':')[1]) > 4294967295 || !extraCases.some(c => c.id === id) || replayMap[k])
                        continue;
                    replayMap[k] = id;
                }
            replayMap = Object.fromEntries(Object.entries(replayMap).slice(-300));
            store.set(REPLAY_KEY, JSON.stringify(replayMap));
            const saved = saveLibrary();
            libStatus = `${L("ui.imported_2006")}${valid.length}${L("ui.duplicates_2007")}${duplicates}${L("ui.invalid_2008")}${invalid}. ${saved ? L("ui.library_saved_2010") : L("ui.available_in_this_session_2011")}${L("ui.each_case_will_be_validated_by_the_solver_when_played_2012")}`;
        }
        catch (e) {
            libStatus = L("ui.import_rejected_2013") + String(e.message || e);
        }
        renderLibrary();
    };
    function parseEpilogue(raw, scenario, ctx = {}) { try {
        const z = JSON.parse(String(raw).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
        if (!z || Object.keys(z).length !== 1 || !("reaction" in z))
            return null;
        return window.GameAPI.safeEpilogue(z.reaction, ctx);
    }
    catch {
        return null;
    } }
    async function generateEpilogue() {
        if (!endState)
            return;
        if (epCtl) {
            epCtl.abort();
            epCtl = null;
            $('eEpilogue').textContent = L("ui.ai_epilogue_2018");
            return;
        }
        const state = endState;
        if (state.generated)
            return;
        if (!cfg.key) {
            $('eBody').textContent = state.base + L("ui.configure_the_key_in_ai_config_to_generate_an_epilogue_2020");
            return;
        }
        const ctl = new AbortController();
        epCtl = ctl;
        $('eEpilogue').textContent = L("ui.cancel_epilogue_2022");
        const r = state.result, g = state.game;
        try {
            const raw = await narrativeRequest(L("ui.write_a_brief_emotional_reaction_in_english_to_the_end_2023"), { result: r.win ? L("ui.victory_2024") : L("ui.defeat_2025"), endReason: r.why || r.how, luAvailable: r.victim !== 'Lu' && r.victim !== 'Cláudio', luTrust: Math.round(g.lu.trust), sanity: Math.round(g.san), notes: g.cards.length, errors: g.stats.wrongAccusations, context: r.reveal.case, endVictim: r.victim || L("ui.none_2028"), peopleInterviewed: NPCS.filter(x => g.asked[x] && Object.keys(g.asked[x]).length).length, physicalEvidence: g.real.filter(c => ['peg', 'frg', 'odr', 'obj'].includes(c.k)).length, dogSniffs: Object.keys(g.sniffed).length, successfulConversations: NPCS.reduce((s, x) => s + g.social.states[x].positive, 0), confidencesObtained: Object.keys(g.dealt).length, notesSharedWithLu: g.lu.shared.length, darkSectors: QUADS.filter(q => g.dark[q]).length, minutesUntilFinalBlackout: Math.max(0, Math.round(Math.max(...Object.values(g.w.blackout)) - g.min)) }, ctl, 12000, 380);
            if (epCtl !== ctl || endState !== state || ctl.signal.aborted)
                return;
            const reaction = parseEpilogue(raw, g.w.scenario, { win: !!r.win, caseVictim: g.w.scenario.victim, endVictim: r.victim || null });
            if (!reaction)
                throw Error(L("ui.invalid_narrative_response_2033"));
            state.generated = true;
            $('eBody').textContent = state.base + L("ui.additional_epilogue_ai_2035") + ((r.victim === 'Lu' || r.victim === 'Cláudio') ? '' : 'Lu: ') + reaction;
            $('eBody').scrollTop = $('eBody').scrollHeight;
        }
        catch (e) {
            if (epCtl === ctl && endState === state)
                $('eBody').textContent = state.base + L("ui.additional_epilogue_unavailable_the_result_and_local_e_2043");
        }
        finally {
            if (epCtl === ctl) {
                epCtl = null;
                $('eEpilogue').textContent = state.generated ? L("ui.epilogue_generated_2045") : L("ui.ai_epilogue_2046");
                $('eEpilogue').disabled = state.generated;
            }
        }
    }
    $('eEpilogue').onclick = generateEpilogue;
    const REACTION_RULE = `${L("ui.each_utterance_is_rejected_if_it_contains_any_of_these_2049")}${window.GameAPI.REACTION_AVOID}${L("ui.do_not_use_names_digits_brackets_braces_or_line_breaks_2050")}`;
    async function llmVoice(x, intent, d, fallback) {
        if (intent === 'lu' || intent === 'ambient')
            return llmSocialExtra(intent, d, fallback);
        if (!cfg.key)
            return fallback;
        if (aiCalls >= 25 || Date.now() < aiCooldownUntil) {
            aiState = 'fallback';
            return fallback;
        }
        const owner = game, rev = owner?.dialogRevision;
        const claims = d.claims || [], v = window.GameAPI.VOICES[x], info = NPC_INFO[x];
        if (!v || !info)
            return fallback;
        const facts = claims.map(c => ({ id: c.id, type: c.kind, person: c.kind === 'self' ? L("ui.i_2055") : nm(c.subject), place: NODES[c.node].name, time: E.spanShort(c.t0, c.t1) }));
        const sys = `${L("ui.play_2056")}${info.name}${L("ui.a_fictional_character_in_pelotas_november_2026_interna_2057")}${info.bio}${L("ui.tone_2058")}${v.greet[0]} / ${v.banter[0]}${L("ui.do_not_reveal_this_direction_speak_in_english_the_utte_2060")}${REACTION_RULE}${L("ui.return_only_json_speech_up_to_280_characters_1_or_2_se_2061")}`;
        const payload = { question: d.q || '', memory: d.social?.memory || [], state: d.social ? { trust: d.social.trust, cooperation: d.social.cooperation, fear: d.social.fear, irritation: d.social.irritation } : null, allowedFacts: facts, strategy: d.strategy || null };
        const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 12000);
        aiCalls++;
        try {
            const r = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', signal: ctl.signal, headers: { Authorization: 'Bearer ' + cfg.key, 'Content-Type': 'application/json', 'X-Title': 'Misterio na Praca' }, body: JSON.stringify({ model: cfg.model || 'openrouter/free', temperature: 0.75, max_tokens: 500, messages: [{ role: 'system', content: sys }, { role: 'user', content: JSON.stringify(payload) }] }) });
            if (!r.ok) {
                if (r.status === 429)
                    aiCooldownUntil = Date.now() + 60000;
                throw new Error('HTTP ' + r.status);
            }
            const j = await r.json(), raw = (j.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '');
            const parsed = window.GameAPI.parseSocial(raw, x, claims, d.scenario);
            if (parsed?.tactic === "deflect" && !d.strategy?.targets.some(a => a.id === parsed.target))
                throw Error(L("ui.unauthorized_target_2077"));
            if (!parsed)
                throw new Error(L("ui.invalid_response_format_or_factual_content_in_reaction_2078"));
            if (game === owner && owner.dialogRevision === rev && !owner.over && (!d.social || owner.busy)) {
                aiState = 'on';
                lastAIError = '';
                render();
            }
            return parsed;
        }
        catch (e) {
            if (game === owner && owner.dialogRevision === rev && !owner.over && (!d.social || owner.busy)) {
                lastAIError = String(e.message || e);
                aiState = 'fallback';
                render();
            }
            return fallback;
        }
        finally {
            clearTimeout(to);
        }
    }
    async function llmSocialExtra(intent, d, fallback) {
        if (!cfg.key || aiCalls >= 25 || Date.now() < aiCooldownUntil)
            return fallback;
        const owner = game, rev = owner?.dialogRevision, api = window.GameAPI;
        let sys, payload;
        if (intent === 'lu') {
            sys = `${L("ui.play_lu_cl_udio_s_longtime_friend_supportive_analytica_2083")}${REACTION_RULE}${L("ui.return_only_json_speech_subjective_reaction_up_to_280__2084")}`;
            payload = { question: d.q, memory: d.memory, trust: d.trust, litSectors: d.lit, notes: d.shared, plans: d.plans };
        }
        else {
            sys = `${L("ui.write_a_casual_conversation_between_two_fictional_char_2085")}${REACTION_RULE}${L("ui.return_only_json_lines_first_line_second_line_id_null__2086")}`;
            payload = { characters: d.pair.map(x => ({ name: nm(x), direction: NPC_INFO[x].bio, topic: api.AMBIENT_TOPICS[x] })), litSectors: d.lit, relations: d.relations || [], allowedFacts: d.claims.map(c => ({ id: c.id, statement: api.publicLabel({ ...c, n: 0 }) })) };
        }
        const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 12000);
        aiCalls++;
        try {
            const r = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', signal: ctl.signal, headers: { Authorization: 'Bearer ' + cfg.key, 'Content-Type': 'application/json', 'X-Title': 'Misterio na Praca' }, body: JSON.stringify({ model: cfg.model || 'openrouter/free', temperature: .75, max_tokens: 500, messages: [{ role: 'system', content: sys }, { role: 'user', content: JSON.stringify(payload) }] }) });
            if (!r.ok) {
                if (r.status === 429)
                    aiCooldownUntil = Date.now() + 60000;
                throw Error('HTTP ' + r.status);
            }
            const j = await r.json(), raw = (j.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '');
            const parsed = intent === 'lu' ? api.parseLu(raw, d.plans, owner.w.scenario) : api.parseAmbient(raw, d.pair, d.claims, owner.w.scenario);
            if (!parsed)
                throw Error(L("ui.invalid_social_response_2101"));
            if (game === owner && owner.dialogRevision === rev && owner.busy && !owner.over) {
                aiState = 'on';
                lastAIError = '';
                render();
            }
            return parsed;
        }
        catch (e) {
            if (game === owner && owner.dialogRevision === rev && owner.busy && !owner.over) {
                aiState = 'fallback';
                lastAIError = String(e.message || e);
                render();
            }
            return fallback;
        }
        finally {
            clearTimeout(to);
        }
    }
    window.__llmVoice = llmVoice;
    const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
    function baseCell(x, y, dark) {
        const t = MAP.T[y][x], g = MAP.G[y][x];
        let ch, c;
        switch (t) {
            case 'g':
                ch = hash(x, y) % 4 === 0 ? '.' : ' ';
                c = 'd2';
                break;
            case 's':
                ch = hash(x, y) % 3 === 0 ? '░' : ' ';
                c = 'd3';
                break;
            case 'w':
                ch = g || '█';
                c = /[A-ZÃÁÉÍÓÚÇ+]/.test(ch) ? 'n' : 'd2';
                break;
            case 'c':
                ch = hash(x, y) % 3 === 0 ? ',' : '"';
                c = 'd2';
                break;
            case 't':
                ch = '♣';
                c = 'n';
                break;
            case 'b':
                ch = '=';
                c = 'n';
                break;
            case 'm':
                ch = g;
                c = 'n';
                break;
            case 'l':
                ch = '¤';
                c = 'n';
                break;
            case 'p': {
                const pole = E.POLES.find(p => p.x === x && p.y === y);
                const off = game.isDark(pole.q);
                const soon = !off && game.w.blackout[pole.q] - game.min < 1.5;
                ch = off ? '¡' : '¥';
                c = off ? 'd3' : (soon && Math.random() < 0.5 ? 'd2' : 'b');
                return [ch, c];
            }
            default:
                ch = '?';
                c = 'n';
        }
        if (dark)
            c = c === 'b' || c === 'n' ? 'd2' : 'd3';
        return [ch, c];
    }
    function comparisonPairs(cards) {
        const cs = cards.filter(c => c.k === 'claim'), out = [];
        for (let i = 0; i < cs.length; i++)
            for (let j = i + 1; j < cs.length; j++) {
                const a = cs[i], b = cs[j];
                if (a.speaker !== b.speaker && E.contradicts(a, b))
                    out.push({ a, b, from: Math.max(a.t0, b.t0), to: Math.min(a.t1, b.t1) });
            }
        return out.sort((p, q) => p.a.subject.localeCompare(q.a.subject) || p.from - q.from || p.a.n - q.a.n);
    }
    function hasAccusation(g) {
        if (!g || !g.w || g.over)
            return false;
        const cs = g.cards.filter(c => !c.fake), evidence = cs.filter(c => ['peg', 'frg', 'snf', 'odr'].includes(c.k));
        for (const { a, b } of comparisonPairs(cs))
            for (const x of new Set([a.speaker, b.speaker])) {
                if (!NPCS.includes(x) || g.refusing[x])
                    continue;
                if (evidence.some(e => E.validateBoard(g.w, cs, x, a, b, e).ok))
                    return true;
            }
        return false;
    }
    function updateAccusationNotice() {
        if (!game || !game.w)
            return;
        const ready = hasAccusation(game), locked = game.board.locked;
        $('bDirectMap').textContent = game.stats.wrongAccusations ? L("ui.accuse_last_chance_2150") : L("ui.accuse_now_2151");
        const btn = $('bDiary');
        btn.textContent = locked ? L("ui.board_2153") : ready ? L("ui.diary_2154") : L("ui.diary_2155");
        btn.classList.toggle('ready', ready || locked);
        if (ready && !game.accusationNotified && !locked && !game.over && !document.getElementById('ovIntro').classList.contains('on')) {
            game.accusationNotified = true;
            ui.log(L("ui.there_is_enough_information_to_support_an_accusation_s_2159"), 'hint');
        }
    }
    function render() {
        if (!game || !game.w)
            return;
        const g = game, rows = [];
        const ents = {};
        const dk = p => g.isDark(g.quadAt(p)) ? ' dk' : '';
        for (const x of NPCS)
            if (g.visible(x))
                ents[g.k(g.ent[x])] = [EMOJI[x], `e e-${x}${dk(g.ent[x])}${g.board.suspect === x ? ' sus' : ''}`];
        if (g.visible('lu'))
            ents[g.k(g.ent.lu)] = [EMOJI.lu, 'e e-lu' + dk(g.ent.lu)];
        ents[g.k(g.dog)] = [EMOJI.dog, 'e e-dog' + dk(g.dog)];
        ents[g.k(g.p)] = [EMOJI.me, 'e e-me' + (g.min < g.emberUntil ? ' blink' : '')];
        const cam = rowsVis < H;
        const r0 = cam ? Math.max(0, Math.min(H - rowsVis, g.p.y - Math.floor(rowsVis / 2))) : 0, r1 = cam ? r0 + rowsVis : H;
        for (let y = r0; y < r1; y++) {
            let row = '';
            for (let x = 0; x < W; x++) {
                const dark = g.isDark(MAP.Q[y][x]) && Math.max(Math.abs(x - g.p.x), Math.abs(y - g.p.y)) > 2;
                let [ch, c] = ents[x + ',' + y] || baseCell(x, y, dark);
                if (g.rainOn && !ents[x + ',' + y] && E.walkable(x, y) && Math.random() < .035) {
                    ch = Math.random() < .5 ? "'" : ',';
                    c = 'd2';
                }
                row += `<span class="mapcell ${c}">${esc(ch)}</span>`;
            }
            rows.push(`<div class="maprow">${row}</div>`);
        }
        $('map').innerHTML = rows.join('');
        const bar = (v, n = 8) => { const f = Math.max(0, Math.round(v / 100 * n)); return '█'.repeat(f) + '░'.repeat(n - f); };
        const streetlights = QUADS.map(q => QUAD_NAMES[q][0] + (g.isDark(q) ? '·' : '¥')).join(' ');
        const here = L("ui.pra_a_cel_pedro_os_rio_2193") + (g.node ? ' › ' + NODES[g.node].shortName : '');
        const ai = cfg.key ? (aiState === 'fallback' ? L("ui.ai_local_2197") : aiState === 'on' ? L("ui.ai_on_2199") : L("ui.ai_ready_2200")) : L("ui.ai_off_2201");
        $('hudText').innerHTML =
            `<span class="b">${g.clock}${L("ui.fri_20_11_2204")}${g.rainOn ? L("ui.drizzle_2205") : L("ui.damp_2206")}  ${streetlights}\n` +
                `HP <span class="${g.hp < 30 ? 'b blink' : 'n'}">${bar(g.hp)}</span>${String(Math.round(g.hp)).padStart(4)}  SAN <span class="${g.san < 35 ? 'b blink' : 'n'}">${bar(g.san)}</span>${String(Math.round(g.san)).padStart(4)}\n` +
                `EN <span class="${g.en < 10 ? 'b blink' : 'n'}">${bar(g.en)}</span>${String(Math.round(g.en)).padStart(4)}  M×${g.monster} C×${g.cig} <span class="d2">${ai}</span>\n` +
                `<span class="d2">@ ${esc(here)}${g.node && g.isDark(NODES[g.node].q) ? L("ui.dark_2231") : ''}${g.board.locked ? L("ui.board_2234") + esc(nm(g.board.suspect)) : ''}</span>`;
        const adj = g.adjacentAll();
        $('bA').textContent = g.socialWorld && g.nearbyPair() ? L("ui.listen_interact_2238") : adj.length ? L("ui.talk_2239") + (adj.length > 1 ? '…' : nm(adj[0]).toUpperCase()) : g.node ? L("ui.examine_2241") + NODES[g.node].shortName.toUpperCase() : L("ui.examine_2242");
        updateAccusationNotice();
    }
    let zoom = store.get('mp_zoom') !== '0', rowsVis = H;
    function fitMap() {
        const app = $('app'), inDlg = $('dlg').classList.contains('on');
        const h = app.clientHeight || window.innerHeight, w = app.clientWidth - 20;
        const hAvail = Math.max(100, h - $('hud').offsetHeight - (inDlg ? Math.max(290, h * .62) : $('controls').offsetHeight + Math.max(120, h * .24)) - 12);
        const fullCell = Math.min(w / W, hAvail / H / 1.25);
        const cell = zoom || inDlg ? Math.min(w / W, 18) : fullCell;
        const ch = cell * 1.25;
        rowsVis = zoom || inDlg ? Math.max(4, Math.min(H, Math.floor(hAvail / ch))) : H;
        $('map').style.setProperty('--cell', cell + 'px');
        $('map').style.setProperty('--cellh', ch + 'px');
        $('map').style.fontSize = (cell * 1.5) + 'px';
    }
    $('zoomBtn').onclick = () => { zoom = !zoom; store.set('mp_zoom', zoom ? '1' : '0'); fitMap(); render(); };
    function renderLog() {
        const el = $('log');
        const follow = el.scrollHeight - el.scrollTop - el.clientHeight < 36 || logLines.length <= 2;
        const last = logLines.slice(-60);
        el.innerHTML = last.map((l, i) => `<p class="${l.cls}${i < last.length - 6 ? ' old' : ''}">${esc(l.t)}</p>`).join('');
        if (follow)
            el.scrollTop = el.scrollHeight;
    }
    function openDialog(d) {
        stopMove();
        const was = $('dlg').classList.contains('on');
        $('log').style.display = 'none';
        $('controls').style.display = 'none';
        $('dlg').classList.add('on');
        if (!was) {
            fitMap();
            render();
        }
        const who = d.who;
        $('portrait').textContent = EMOJI[who] || EMOJI.me;
        $('dlgWho').textContent = who ? nm(who) : 'Cláudio';
        const COL = { bento: '#55dcff', fiscal: '#ffe14a', tereza: '#ff8ae0', guri: '#ffa04a', leitor: '#bba4ff', lu: '#ff5a5a' };
        $('dlgWho').style.color = $('portrait').style.color = (who && COL[who]) || '';
        $('dlgRole').textContent = NPCS.includes(who) ? game.social.mood(who) : '';
        const ab = $('bAccuse');
        ab.hidden = game.over;
        const lockedHere = game.board.locked && game.board.suspect === who;
        ab.textContent = L("ui.accuse_2293");
        const ready = hasAccusation(game);
        ab.classList.toggle('ready', ready || lockedHere);
        if (d.accusable && ready && !game.board.locked)
            $('dlgRole').textContent = L("ui.enough_information_to_accuse_2296");
        ab.onclick = () => { if (game.over || ab.hidden)
            return; openDirectAccuse(NPCS.includes(who) ? who : null); };
        updateAccusationNotice();
        const qh = d.q ? `<div class="cq">Cláudio: ${esc(d.q)}</div>` : '';
        if (d.text === null)
            $('dlgText').innerHTML = qh + L("ui.thinking_2301");
        else {
            $('dlgText').innerHTML = qh + esc(d.text);
            if (who && d.text && d.q)
                logLines.push({ t: `${nm(who)}: ${d.text}`, cls: 'npc' });
        }
        $('dlgText').scrollTop = 0;
        const box = $('dlgOpts');
        box.innerHTML = '';
        if (d.freePending) {
            const skip = document.createElement('button');
            skip.textContent = L("ui.answer_without_ai_2311");
            skip.onclick = () => game.skipFree?.();
            box.appendChild(skip);
        }
        (d.options || []).forEach((o, i) => {
            const b = document.createElement('button');
            b.textContent = `${i + 1}. ${o.label}`;
            if (o.hot)
                b.className = 'hot';
            b.onclick = () => { if (game.busy)
                return; o.fn(); };
            box.appendChild(b);
        });
    }
    function freeAsk(x) {
        if (game.over || game.busy || game.refusing[x])
            return;
        const lu = x === 'lu';
        openDialog({ who: x, text: lu ? L("ui.discuss_a_hypothesis_or_ask_for_a_suggestion_lu_rememb_2318") : L("ui.speak_freely_ask_empathize_argue_or_challenge_the_char_2319"), options: [] });
        const box = $('dlgOpts'), row = document.createElement('div');
        row.className = 'row';
        const inp = document.createElement('input');
        inp.maxLength = 300;
        inp.placeholder = L("ui.type_your_message_2324");
        inp.setAttribute('aria-label', L("ui.cl_udio_s_message_2326"));
        const send = document.createElement('button');
        send.textContent = L("ui.send_2328");
        send.style.flex = 'none';
        send.style.padding = '0 10px';
        const go = () => { const q = inp.value.trim(); if (!q || game.busy)
            return; send.disabled = true; lu ? game.luDiscuss(q) : game.askFree(x, q); };
        send.onclick = go;
        inp.onkeydown = e => { if (e.key === 'Enter')
            go(); };
        row.append(inp, send);
        box.appendChild(row);
        const back = document.createElement('button');
        back.textContent = L("ui.back_2333");
        back.onclick = () => lu ? game.talkLu() : game.menuNPC(x, '...');
        box.appendChild(back);
        const mem = (lu ? game.lu.memory : game.social.states[x].memory).slice(-5);
        if (mem.length) {
            const hist = document.createElement('details');
            const summary = document.createElement('summary');
            summary.textContent = L("ui.recent_conversations_2337");
            hist.appendChild(summary);
            for (const m of mem) {
                const p = document.createElement('p');
                p.textContent = 'Cláudio: ' + m.q + '\n' + nm(x) + ': ' + m.reply;
                p.style.whiteSpace = 'pre-wrap';
                hist.appendChild(p);
            }
            box.appendChild(hist);
        }
        setTimeout(() => inp.focus(), 50);
    }
    let dTab = "facts", fFilter = null, bsel = { s: null, a: null, b: null, e: null }, bMsg = '', boardOnlyPairs = false, accuseFrom = null;
    const glitch = s => s.replace(/[aeos]/g, ch => Math.random() < 0.35 ? ({ a: '@', e: '3', o: '0', s: '$' })[ch] : ch);
    function claimText(c) {
        const who = c.kind === 'self' ? `${nm(c.speaker)}${L("ui.claims_to_have_been_2351")}` : `${nm(c.speaker)}${L("ui.saw_2353")}${nm(c.subject)}`;
        const t = `${who} ${NODES[c.node].locationPhrase} · ${E.spanShort(c.t0, c.t1)}`;
        return c.fake ? glitch(t) : t;
    }
    function evText(c) {
        switch (c.k) {
            case 'vis': return `${nm(c.x)}${L("ui.footwear_2361")}${c.shoe}${L("ui.clothing_2362")}${c.color}`;
            case 'snf': return `${L("ui.dog_with_2365")}${nm(c.x)}${L("ui.odor_of_2366")}${c.smell} · ${c.contact ? L("ui.growled_contact_with_scene_2368") : L("ui.indifferent_2369")}`;
            case 'peg': return `${L("ui.footprint_at_scene_2372")}${c.shoe}`;
            case 'odr': return `${L("ui.odor_at_scene_2375")}${c.smell}`;
            case 'frg': return `${L("ui.fiber_2378")}${c.color} ${NODES[c.node].locationPhrase}`;
            case 'obj': return `${L("ui.crime_object_2382")}${c.name}`;
            case "note": return `${L("ui.reaction_2385")}${c.text}`;
        }
        return '?';
    }
    let directSelected = null;
    function renderDirectAccuse() {
        if (game.refusing[directSelected])
            directSelected = null;
        $('directSuspects').innerHTML = NPCS.map(x => `<button type="button" data-direct="${x}" class="${x === directSelected ? 'on' : ''}" aria-pressed="${x === directSelected}"${game.refusing[x] ? ' disabled' : ''}>${EMOJI[x]} ${esc(nm(x))}${game.refusing[x] ? L("ui.ruled_out_innocent_2400") : ''}</button>`).join('');
        $('bConfirmAccuse').disabled = !NPCS.includes(directSelected);
        const n = game.stats.wrongAccusations;
        const risk = n ? L("ui.last_chance_another_error_ends_the_game_2405") : L("ui.first_error_25_san_one_sector_goes_dark_the_innocent_s_2406");
        $('accuseWarning').textContent = (directSelected ? `${L("ui.you_accuse_2408")}${nm(directSelected)}. ` : L("ui.select_a_suspect_2410")) + `${L("ui.errors_2411")}${n}${L("ui.2_a_correct_accusation_wins_2412")}${risk}`;
    }
    function openDirectAccuse(x = null) {
        if (!game || game.over || $('ovIntro').classList.contains('on'))
            return;
        stopMove();
        directSelected = NPCS.includes(x) ? x : null;
        renderDirectAccuse();
        $('ovAccuse').classList.add('on');
        $('ovAccuse').querySelector('.body').scrollTop = 0;
    }
    function closeDirectAccuse() { $('ovAccuse').classList.remove('on'); directSelected = null; }
    $('directSuspects').addEventListener('click', e => { const b = e.target.closest('[data-direct]'); if (b && !b.disabled && !game.refusing[b.dataset.direct]) {
        directSelected = b.dataset.direct;
        renderDirectAccuse();
    } });
    $('bCancelAccuse').onclick = closeDirectAccuse;
    $('bConfirmAccuse').onclick = () => { const x = directSelected; if (game.over || !NPCS.includes(x) || game.refusing[x])
        return; closeDirectAccuse(); ['ovDiary', 'ovCfg', 'ovItems'].forEach(id => $(id).classList.remove('on')); accuseFrom = null; game.directAccuse(x); };
    $('bAccuseBoard').onclick = () => { const x = directSelected; closeDirectAccuse(); $('ovCfg').classList.remove('on'); $('ovItems').classList.remove('on'); openAccusation(x); };
    $('bDirectMap').onclick = () => openDirectAccuse();
    $('bDirectDiary').onclick = () => openDirectAccuse(game.board.locked ? game.board.suspect : bsel.s);
    $('bDirectItems').onclick = () => openDirectAccuse();
    $('bDirectCfg').onclick = () => openDirectAccuse();
    function openAccusation(x = null) {
        stopMove();
        if (game.over || game.busy)
            return;
        if (game.refusing[x])
            x = null;
        accuseFrom = x;
        dTab = "board";
        bMsg = '';
        if (x && !game.board.locked) {
            if (bsel.s !== x)
                bsel = { s: x, a: null, b: null, e: null };
        }
        $('ovDiary').classList.add('on');
        renderDiary();
        $('dBody').scrollTop = 0;
    }
    function closeDiary() {
        $('ovDiary').classList.remove('on');
        const x = accuseFrom;
        accuseFrom = null;
        if (x && !game.over && $('dlg').classList.contains('on')) {
            if (game.adjacentAll().includes(x))
                game.menuNPC(x, '...');
            else
                ui.closeDialog();
        }
        render();
    }
    function pairMarkup(p, selectable = true) {
        const side = c => `<div class="pairSide"><b>#${c.n} · ${esc(nm(c.speaker))}</b>${esc(claimText(c))}</div>`;
        return `<div class="aPair"><div class="note">${esc(nm(p.a.subject))}${L("ui.same_time_2455")}${esc(E.spanShort(p.from, p.to))}</div><div class="pairRow">${side(p.a)}${side(p.b)}</div>${selectable ? `<button data-pair="${p.a.n},${p.b.n}${L("ui.use_both_statements_2461")}` : ''}</div>`;
    }
    function renderDiary() {
        const g = game, body = $('dBody');
        document.querySelectorAll('#dTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === dTab));
        const claims = g.cards.filter(c => c.k === 'claim'), evs = g.cards.filter(c => c.k !== 'claim');
        const card = (c, sel, txt) => `<div class="card${sel ? ' sel' : ''}${c.key ? ' key' : ''}" data-n="${c.n}" ${dTab === "board" && !g.board.locked ? 'role="button" tabindex="0" aria-pressed="' + (!!sel) + '"' : ''}><div class="m">#${c.n} · ${esc(c.src)}${L("ui.noted_2483")}${c.at}</div>${esc(txt)}</div>`;
        const pairs = comparisonPairs(claims), locked = g.board.locked;
        const find = n => g.cards.find(c => c.n === n);
        const selected = locked ? { s: g.board.suspect, a: g.board.sel.a.n, b: g.board.sel.b.n, e: g.board.sel.e.n } : bsel;
        const A = find(selected.a), B = find(selected.b), Ev = find(selected.e);
        const complete = !!(selected.s && A && B && Ev && A.n !== B.n);
        const nearLocked = locked && g.adjacentAll().includes(g.board.suspect);
        $('bClose').hidden = dTab !== "board" || locked;
        $('bClose').disabled = !complete || g.over;
        $('bGoConfront').hidden = dTab !== "board" || !nearLocked || g.over;
        $('dClose').textContent = locked ? L("ui.return_to_the_square_2492") : accuseFrom ? L("ui.return_to_conversation_2493") : L("ui.close_diary_2494");
        if (dTab === "facts") {
            const chips = `<div class="chips"><button data-f="" class="${!fFilter ? 'on' : ''}${L("ui.all_2499")}${NPCS.map(x => `<button data-f="${x}" class="${fFilter === x ? 'on' : ''}${L("ui.about_span_class_e_e_2504")}${x}">${EMOJI[x]}</span></button>`).join('')}</div>`;
            const list = claims.filter(c => !fFilter || c.subject === fFilter).sort((a, b) => a.subject.localeCompare(b.subject) || a.t0 - b.t0);
            const compared = pairs.filter(p => !fFilter || p.a.subject === fFilter);
            body.innerHTML = chips + `${L("ui.incompatible_statements_2509")}${compared.length})</div>` + (compared.length ? compared.map(p => pairMarkup(p, !locked)).join('') : L("ui.no_incompatible_pair_in_this_filter_continue_investiga_2512")) + L("ui.all_statements_2513") + (list.length ? list.map(c => card(c, false, claimText(c))).join('') : L("ui.no_statements_yet_talk_to_the_regulars_2515")) +
                L("ui.tip_filter_by_person_and_look_for_the_same_person_in_t_2516");
        }
        else if (dTab === "clues") {
            body.innerHTML = evs.length ? evs.map(c => card(c, false, evText(c))).join('') : L("ui.no_physical_or_sensory_clues_examine_locations_and_use_2519");
        }
        else if (dTab === "board") {
            const count = [selected.s, A, B, Ev].filter(Boolean).length;
            const missing = [!selected.s ? L("ui.suspect_2521") : null, !A ? L("ui.first_statement_2522") : null, !B ? L("ui.second_statement_2523") : null, !Ev ? L("ui.evidence_2524") : null].filter(Boolean);
            const linked = A && B && E.contradicts(A, B) && A.speaker !== B.speaker;
            const available = hasAccusation(g);
            const supported = evs.filter(c => ['peg', 'frg', 'snf', 'odr', 'obj'].includes(c.k));
            const displayed = boardOnlyPairs && selected.s ? pairs.filter(p => [p.a.speaker, p.b.speaker].includes(selected.s)) : pairs;
            const status = locked ? `${L("ui.accusation_validated_2530")}${esc(nm(selected.s))}</b><br>${nearLocked ? L("ui.you_re_nearby_tap_confront_now_2532") : L("ui.return_to_the_square_find_this_person_and_choose_confr_2533")}${L("ui.during_confrontation_present_the_contradiction_and_sup_2534")}` :
                `<div class="aStatus"><b>${count}${L("ui.4_elements_selected_div_class_aprogress_aria_label_2536")}${count}${L("ui.of_4_elements_2537")}${[selected.s, A, B, Ev].map(v => `<span class="${v ? 'done' : ''}"></span>`).join('')}</div>${missing.length ? L("ui.missing_2544") + missing.join(', ') + '.' : L("ui.all_fields_filled_check_before_validating_2547")}<br><span class="note">${available ? L("ui.the_diary_contains_enough_information_to_formulate_an__2549") : L("ui.keep_questioning_examining_the_setting_and_using_chris_2550")}</span></div>`;
            body.innerHTML = status + (bMsg ? `<div class="aStatus" role="status">${esc(bMsg)}</div>` : '') +
                `${L("ui.1_who_do_you_accuse_2555")}${NPCS.map(x => `<button data-s="${x}" ${locked || g.refusing[x] ? 'disabled' : ''} class="${selected.s === x ? 'on' : ''}">${EMOJI[x]} ${esc(nm(x))}${g.refusing[x] ? L("ui.ruled_out_2566") : ''}</button>`).join('')}</div>` +
                `${L("ui.2_what_is_the_contradiction_statement_1_2571")}${A ? '#' + A.n + ' ' + esc(claimText(A)) : '—'}${L("ui.statement_2_2575")}${B ? '#' + B.n + ' ' + esc(claimText(B)) : '—'}</b></div>` +
                (A && B ? `<p class="note">${linked ? L("ui.the_statements_contradict_each_other_in_time_and_place_2581") : L("ui.these_statements_do_not_form_a_contradiction_between_t_2582")}${L("ui.the_contradiction_must_involve_a_statement_by_the_susp_2583")}` : L("ui.choose_two_statements_about_the_same_person_in_differe_2584")) +
                `${L("ui.3_what_is_the_evidence_evidence_2585")}${Ev ? '#' + Ev.n + ' ' + esc(evText(Ev)) : '—'}</b></div>` +
                (locked ? '' : `${L("ui.compare_footprint_fabric_or_odor_to_the_suspect_or_use_2591")}${displayed.length})</div><div class="aTools"><button id="bPairFilter" ${selected.s ? '' : 'disabled'}>${boardOnlyPairs ? L("ui.show_all_2596") : L("ui.filter_by_suspect_2597")}</button></div>${displayed.length ? displayed.map(p => pairMarkup(p)).join('') : L("ui.no_pairs_in_this_filter_yet_see_all_statements_below_2600")}${L("ui.select_statements_individually_2601")}${claims.length})</summary>${claims.map(c => card(c, c.n === selected.a || c.n === selected.b, claimText(c))).join('') || L("ui.no_statements_2604")}${L("ui.choose_evidence_2605")}${supported.length})</div>${supported.map(c => card(c, c.n === selected.e, evText(c))).join('') || L("ui.no_physical_or_sensory_evidence_examine_the_scene_and__2608")}${L("ui.clothing_footwear_and_other_reactions_remain_available_2609")}`);
        }
        else {
            const w = g.w;
            body.innerHTML = `${L("ui.the_case_2610")}${esc(w.scenario.title)}</b><br>${esc(w.scenario.context)}${L("ui.today_at_2612")}${w.time}${L("ui.lu_heard_2613")}${esc(w.scenario.sound)}${L("ui.coming_from_2614")}${esc(NODES[w.S].locationPhrase)}</b> (${esc(NODES[w.S].name)}${L("ui.among_the_five_regulars_there_are_1_killer_2_informant_2616")}${w.seed}${L("ui.mode_2617")}${w.mode === 'mvp' ? 'normal' : L("ui.advanced_2620")}${L("ui.notes_2621")}${g.cards.length}</p>`;
        }
    }
    function handleDiaryClick(e) {
        const f = e.target.closest('[data-f]');
        if (f) {
            fFilter = f.dataset.f || null;
            return renderDiary();
        }
        const pair = e.target.closest('[data-pair]');
        if (pair && !game.board.locked) {
            const [a, b] = pair.dataset.pair.split(',').map(Number);
            bsel.a = a;
            bsel.b = b;
            dTab = "board";
            bMsg = '';
            renderDiary();
            $('dBody').scrollTop = 0;
            return;
        }
        if (game.board.locked)
            return;
        const suspect = e.target.closest('[data-s]');
        if (suspect) {
            if (suspect.disabled || game.refusing[suspect.dataset.s])
                return;
            bsel.s = suspect.dataset.s;
            bMsg = '';
            return renderDiary();
        }
        if (e.target.id === 'bReset') {
            bsel = { s: accuseFrom || null, a: null, b: null, e: null };
            bMsg = '';
            return renderDiary();
        }
        if (e.target.id === 'bPairFilter') {
            boardOnlyPairs = !boardOnlyPairs;
            return renderDiary();
        }
        if (e.target.id === 'bJumpEvidence') {
            document.getElementById('evidenceList')?.scrollIntoView({ block: 'start' });
            return;
        }
        const c = e.target.closest('.card');
        if (!c || dTab !== "board")
            return;
        const n = +c.dataset.n, card = game.cards.find(x => x.n === n);
        if (!card)
            return;
        const scroll = $('dBody').scrollTop, expanded = $('dBody').querySelector('details')?.open;
        if (card.k === 'claim') {
            if (bsel.a === n)
                bsel.a = null;
            else if (bsel.b === n)
                bsel.b = null;
            else if (!bsel.a)
                bsel.a = n;
            else if (!bsel.b)
                bsel.b = n;
            else {
                bsel.a = bsel.b;
                bsel.b = n;
            }
        }
        else
            bsel.e = bsel.e === n ? null : n;
        bMsg = '';
        renderDiary();
        const details = $('dBody').querySelector('details');
        if (details && expanded)
            details.open = true;
        $('dBody').scrollTop = scroll;
    }
    $('dBody').addEventListener('click', handleDiaryClick);
    $('dBody').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.card[role=button]')) {
        e.preventDefault();
        e.target.click();
    } });
    $('bClose').onclick = () => {
        if (game.over || game.busy || game.board.locked)
            return;
        const find = n => game.cards.find(c => c.n === n);
        const r = game.closeBoard(bsel.s, find(bsel.a), find(bsel.b), find(bsel.e));
        if (game.over) {
            $('ovDiary').classList.remove('on');
            return;
        }
        bMsg = r.ok ? L("ui.eureka_now_confront_the_accused_2657") : r.why;
        if (r.ok) {
            $('app').classList.add('flick');
            setTimeout(() => $('app').classList.remove('flick'), 1600);
        }
        renderDiary();
        $('dBody').scrollTop = 0;
    };
    $('bGoConfront').onclick = () => {
        const x = game.board.suspect;
        if (game.over || !game.board.locked || game.refusing[x] || !game.adjacentAll().includes(x))
            return;
        $('ovDiary').classList.remove('on');
        accuseFrom = null;
        game.confront(x);
    };
    document.querySelectorAll('#dTabs button').forEach(b => b.onclick = () => { dTab = b.dataset.t; renderDiary(); $('dBody').scrollTop = 0; });
    $('bDiary').onclick = () => { stopMove(); if (game.over)
        return; accuseFrom = null; if (game.board.locked || hasAccusation(game))
        dTab = "board"; $('ovDiary').classList.add('on'); renderDiary(); $('dBody').scrollTop = 0; };
    $('dClose').onclick = closeDiary;
    function renderItems() {
        const g = game;
        $('iBody').innerHTML = `${L("ui.monster_ultra_white_2675")}${g.monster}${L("ui.30_energy_and_faster_steps_for_10_min_agitation_4_san__2676")}${g.cig}${L("ui.12_san_clears_up_to_2_false_diary_notes_4_hp_ember_vis_2677")}${Math.round(g.hp)} · SAN ${Math.round(g.san)} · EN ${Math.round(g.en)}${L("ui.san_below_35_causes_your_mind_to_invent_notes_2680")}`;
    }
    $('iBody').addEventListener('click', e => { const c = e.target.closest('[data-i]'); if (!c)
        return; game.useItem(c.dataset.i); renderItems(); });
    $('bItems').onclick = () => { stopMove(); if (game.over)
        return; renderItems(); $('ovItems').classList.add('on'); };
    $('iClose').onclick = () => $('ovItems').classList.remove('on');
    let rep = null, stickPointer = null, direction = null;
    function startMove(dx, dy) { if (!game || game.over || game.busy || document.querySelector('.ov.on') || $('dlg').classList.contains('on'))
        return; game.move(dx, dy); }
    function stopMove() { if (rep)
        clearInterval(rep); rep = null; direction = null; stickPointer = null; $('stick').style.transform = 'translate(-50%,-50%)'; }
    const padEl = $('pad');
    function steer(e) {
        if (e.pointerId !== stickPointer)
            return;
        const r = padEl.getBoundingClientRect(), dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2, dist = Math.hypot(dx, dy), limit = r.width * .30, scale = dist > limit ? limit / dist : 1;
        $('stick').style.transform = `translate(calc(-50% + ${dx * scale}px),calc(-50% + ${dy * scale}px))`;
        const next = dist < r.width * .12 ? null : (Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]);
        if (String(next) !== String(direction)) {
            direction = next;
            if (next)
                startMove(...next);
        }
    }
    padEl.addEventListener('pointerdown', e => { if (stickPointer !== null)
        return; e.preventDefault(); stickPointer = e.pointerId; padEl.setPointerCapture(e.pointerId); steer(e); rep = setInterval(() => { if (direction)
        startMove(...direction); }, 145); });
    padEl.addEventListener('pointermove', steer);
    for (const evt of ['pointerup', 'pointercancel', 'lostpointercapture'])
        padEl.addEventListener(evt, e => { if (e.pointerId === stickPointer)
            stopMove(); });
    window.addEventListener('blur', stopMove);
    document.addEventListener('visibilitychange', () => { if (document.hidden)
        stopMove(); });
    $('bWait').onclick = () => { game.advance(1); ui.log(L("ui.you_wait_one_minute_listening_to_the_drizzle_2708"), 'dim'); };
    $('bA').onclick = () => game.act();
    $('bDog').onclick = () => game.sniff();
    document.addEventListener('keydown', e => {
        if (!game || game.over || document.activeElement.tagName === 'INPUT')
            return;
        if (document.querySelector('.ov.on')) {
            if (e.key === 'Escape') {
                if ($('ovLibrary').classList.contains('on'))
                    closeLibrary();
                else if ($('ovAccuse').classList.contains('on'))
                    closeDirectAccuse();
                else if ($('ovDiary').classList.contains('on'))
                    closeDiary();
                else
                    document.querySelectorAll('.ov.on').forEach(o => o.id !== 'ovIntro' && o.id !== 'ovEnd' && o.classList.remove('on'));
            }
            return;
        }
        if (e.key.toLowerCase() === 'q') {
            e.preventDefault();
            openDirectAccuse();
            return;
        }
        if ($('dlg').classList.contains('on')) {
            const n = parseInt(e.key);
            if (n) {
                const b = $('dlgOpts').querySelectorAll('button')[n - 1];
                b && b.click();
            }
            return;
        }
        const k = e.key.toLowerCase(), mv = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] }[k];
        if (mv) {
            e.preventDefault();
            game.move(...mv);
        }
        else if (k === 'e' || k === 'enter')
            game.act();
        else if (k === 'f')
            game.sniff();
        else if (k === 'tab' || k === 'j') {
            e.preventDefault();
            $('bDiary').click();
        }
    });
    $('legend').innerHTML = L("ui.legend_cl_udio_christopher_lu_seu_bento_fiscal_dona_te_2738");
    function openCfg() {
        stopMove();
        $('cKey').value = cfg.key;
        $('cModel').value = cfg.model;
        $('cSeed').value = curSeed ?? '';
        $('cStatus').textContent = cfg.key ? `${L("ui.key_loaded_requests_this_game_2744")}${aiCalls}/25.` : L("ui.no_key_conversation_uses_local_rules_2746");
        $('bDirectCfg').hidden = $('ovIntro').classList.contains('on');
        $('ovCfg').classList.add('on');
    }
    $('menuBtn').onclick = openCfg;
    $('bCfg1').onclick = openCfg;
    $('cClose').onclick = () => { $('ovCfg').classList.remove('on'); render(); };
    $('cSave').onclick = () => { cfg.key = $('cKey').value.trim(); cfg.model = $('cModel').value.trim() || 'openrouter/free'; store.set('mp_key', cfg.key); store.set('mp_model', cfg.model); aiState = 'off'; $('cStatus').textContent = L("ui.saved_2765"); };
    $('cClear').onclick = () => { cfg.key = ''; $('cKey').value = ''; store.del('mp_key'); $('cStatus').textContent = L("ui.key_deleted_2772"); };
    $('cTest').onclick = async () => {
        cfg.key = $('cKey').value.trim();
        cfg.model = $('cModel').value.trim() || 'openrouter/free';
        if (!cfg.key) {
            $('cStatus').textContent = L("ui.enter_your_key_2778");
            return;
        }
        $('cStatus').textContent = L("ui.testing_2780");
        const fb = '__fallback__';
        const t = await llmVoice('bento', 'free', { claims: [], q: L("ui.do_you_prefer_calm_conversations_2784"), scenario: game.w.scenario }, fb);
        $('cStatus').textContent = t === fb ? L("ui.failed_2786") + (lastAIError || L("ui.no_response_or_limit_reached_2787")) + L("ui.the_game_will_use_local_mode_2788") : L("ui.ok_seu_bento_replies_2789") + t.speech;
    };
    $('cNew').onclick = () => { const s = parseInt($('cSeed').value, 10); newGame(Number.isFinite(s) ? s : undefined); $('ovCfg').classList.remove('on'); };
    $('cRand').onclick = () => { newGame(); $('ovCfg').classList.remove('on'); };
    document.querySelectorAll('#modeChips button').forEach(b => b.onclick = () => { mode = b.dataset.m; document.querySelectorAll('#modeChips button').forEach(x => x.classList.toggle('on', x === b)); });
    $('title').textContent = TITLE;
    $('introText').innerHTML = L("ui.friday_november_20_2026_21_43_fine_drizzle_in_pra_a_co_2802");
    const lastCaseKey = language === 'en' ? 'mp_last_case_v16_en' : 'mp_last_case_v5';
    let lastCase = store.get(lastCaseKey) || null;
    const openingSelection = E.timeSelection(new Date(), lastCase, extraCases);
    let firstStart = true;
    function newGame(seed, chosen = null) {
        stopMove();
        abortNarrative();
        if (game) {
            game.dialogRevision++;
            game.skipFree?.();
            game.skipFree = null;
            game.busy = false;
        }
        const automatic = seed == null;
        const selection = chosen ? { seed: automatic ? E.timeSelection(new Date()).seed : Number(seed) >>> 0, caseId: chosen.id } : automatic ? (firstStart ? openingSelection : E.timeSelection(new Date(), lastCase, extraCases)) : { seed: Number(seed) >>> 0, caseId: replayMap[mode + ':' + (Number(seed) >>> 0)] || null };
        const selected = chosen || getCase(selection.caseId), custom = selected?.source ? selected : null;
        if (!automatic && !chosen && selection.caseId && !selected) {
            libStatus = L("ui.this_seed_belongs_to_a_case_no_longer_in_the_library_i_2805");
            $('ovLibrary').classList.add('on');
            renderLibrary();
            return;
        }
        let w;
        if (!chosen && firstStart && automatic && game && game.w && game.mode === mode && game.w.scenario.id === selection.caseId) {
            w = game.w;
        }
        else {
            const next = new Game(ui);
            try {
                w = next.start(selection.seed, mode, automatic && !chosen ? lastCase : null, selected?.id || null, custom);
            }
            catch (e) {
                libStatus = String(e.message || e);
                $('ovLibrary').classList.add('on');
                renderLibrary();
                return;
            }
            game = next;
        }
        game.voice = llmVoice;
        game.socialWorld = true;
        aiCalls = 0;
        aiState = 'off';
        firstStart = false;
        endState = null;
        curSeed = w.seed;
        lastCase = w.scenario.id;
        rememberReplay(w);
        store.set(lastCaseKey, lastCase);
        logLines = [];
        bsel = { s: null, a: null, b: null, e: null };
        bMsg = '';
        fFilter = null;
        dTab = "facts";
        accuseFrom = null;
        boardOnlyPairs = false;
        ui.closeDialog();
        ['ovIntro', 'ovEnd', 'ovDiary', 'ovItems', 'ovAccuse', 'ovCfg', 'ovLibrary'].forEach(id => $(id).classList.remove('on'));
        ui.log(`${L("ui.case_2822")}${w.scenario.title}. ${w.scenario.context}`, 'clue');
        ui.log(`${L("ui.21_43_lu_pulls_your_arm_at_2826")}${w.time}${L("ui.i_heard_2827")}${w.scenario.sound} ${NODES[w.S].locationPhrase}${L("ui.i_don_t_know_if_it_s_connected_to_the_lights_but_someo_2829")}${w.scenario.victim}${L("ui.let_s_separate_the_issues_okay_2830")}`, 'npc');
        ui.log(L("ui.accuse_now_is_available_from_the_beginning_choose_who__2832"), 'hint');
        $('log').scrollTop = 0;
        try {
            screen.orientation && screen.orientation.lock && screen.orientation.lock('portrait').catch(() => { });
        }
        catch (e) { }
        fitMap();
        render();
    }
    function showEnd(r) {
        stopMove();
        ['ovDiary', 'ovAccuse', 'ovCfg', 'ovItems'].forEach(id => $(id).classList.remove('on'));
        directSelected = null;
        accuseFrom = null;
        const v = r.reveal;
        const whyTxt = {
            blackout: `${L("ui.the_last_streetlight_goes_out_the_square_plunges_into__2841")}${r.victim === 'Cláudio' ? L("ui.cl_udio_s_body_by_the_monument_the_dog_never_left_his__2843") : L("ui.the_body_of_2844") + r.victim + L("ui.near_2845") + L("ui.the_benches_2846")}`,
            wrong_accusation: `${L("ui.you_were_wrong_for_the_second_time_in_accusing_2848")}${r.accused}${L("ui.the_real_culprit_escaped_while_the_investigation_follo_2849")}`,
            sanity: L("ui.sanity_loss_ending_2850"),
            health: L("ui.cl_udio_collapses_breathless_on_the_wet_pavement_2851"),
            escape: `${L("ui.the_killer_disappears_into_the_shadows_in_the_darkness_2852")}${r.victim}.`,
        }[r.why];
        $('eTitle').textContent = r.win ? (r.how === "shortcut" ? L("ui.unmasked_on_the_spot_2856") : L("ui.case_closed_2857")) : r.why === "wrong_accusation" ? L("ui.wrong_accusation_2859") : L("ui.the_square_went_dark_2860");
        $('eBody').textContent = (r.win ? (r.how === "accusation" ? `${L("ui.correct_accusation_2863")}${v.killer}${L("ui.was_the_killer_case_closed_at_2864")}${r.clock}.\n\n` : `${v.killer}${L("ui.confesses_at_2867")}${r.clock}${L("ui.the_remaining_lights_flicker_but_hold_2868")}`) : whyTxt + '\n\n') +
            `${L("ui.what_happened_case_2870")}${v.case}${L("ui.killer_2871")}${v.killer}${L("ui.scene_2872")}${v.scene}${L("ui.at_2873")}${v.time}${L("ui.lie_2874")}${v.lie}${L("ui.actual_route_2875")}${v.route}${L("ui.informants_2876")}${v.informants}${L("ui.neutrals_2877")}${v.neutrals}${L("ui.verified_victory_route_2878")}${v.solution}\n\nseed ${v.seed}${L("ui.mode_2880")}${v.mode === 'mvp' ? 'normal' : L("ui.advanced_2883")}`;
        const g = game;
        const local = r.win ? (g.lu.trust >= 50 ? L("ui.lu_allows_herself_a_tired_smile_christopher_shakes_his_2885") : L("ui.cl_udio_remains_thoughtful_the_case_is_solved_but_the__2886")) : (r.victim === 'Lu' || r.victim === 'Cláudio' ? L("ui.the_drizzle_continues_the_silence_left_behind_is_heavi_2889") : L("ui.the_tension_does_not_disappear_with_the_end_of_the_inv_2890"));
        $('eBody').textContent += `${L("ui.motive_2892")}${v.motive}${L("ui.side_secrets_2893")}${v.secrets}${L("ui.epilogue_2894")}${local}${L("ui.case_id_2895")}${v.caseId}`;
        endState = { result: r, game: g, base: $('eBody').textContent, generated: false };
        $('eEpilogue').textContent = L("ui.ai_epilogue_2899");
        $('eEpilogue').disabled = false;
        $('eEpilogue').hidden = !cfg.key;
        $('ovEnd').classList.add('on');
    }
    $('bStart').onclick = () => newGame();
    $('eSame').onclick = () => newGame(curSeed, game.w.scenario);
    $('eNew').onclick = () => newGame();
    window.addEventListener('resize', () => { fitMap(); render(); });
    setInterval(() => { if (game && game.w && !game.over && !document.querySelector('.ov.on')) {
        if (!$('dlg').classList.contains('on'))
            game.idle();
        if (game.rainOn && !$('dlg').classList.contains('on'))
            render();
    } }, 700);
    game = new Game(ui);
    {
        const c = getCase(openingSelection.caseId);
        game.start(openingSelection.seed, mode, lastCase, openingSelection.caseId, c?.source ? c : null);
    }
    fitMap();
    render();
    window.__game = () => game;
}

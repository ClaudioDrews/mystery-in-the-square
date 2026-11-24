/* Procedural world, evidence generation and solver. */
(function (root) {
    'use strict';
    const { t: L, regex: R, language } = typeof module !== 'undefined' && module.exports ? require('./localization.js') : root.Localization;
    function mulberry32(a) {
        return function () {
            a |= 0;
            a = a + 0x6D2B79F5 | 0;
            let t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
    function RNG(seed) {
        const f = mulberry32(seed >>> 0);
        const r = {
            f, int: (a, b) => a + Math.floor(f() * (b - a + 1)),
            pick: arr => arr[Math.floor(f() * arr.length)],
            chance: p => f() < p,
            shuffle: arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(f() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            } return a; },
        };
        return r;
    }
    const NPCS = ['bento', 'fiscal', 'tereza', 'guri', 'leitor'];
    const NPC_INFO = {
        bento: { name: 'Seu Bento', letter: 'B', bio: L("engine.reserved_practical_speaks_with_a_s_o_paulo_accent_know_8") },
        fiscal: { name: 'Fiscal', letter: 'F', bio: L("engine.dry_bureaucratic_arrogant_thinks_like_a_municipal_tax__11") },
        tereza: { name: 'Dona Tereza', letter: 'T', bio: L("engine.89_years_old_affectionate_talkative_and_observant_know_14") },
        guri: { name: 'Guri do Mate', letter: 'G', bio: L("engine.23_years_old_real_estate_jargon_excessive_confidence_e_17") },
        leitor: { name: 'Leitor', letter: 'L', bio: L("engine.bitter_ironic_banking_vocabulary_resentful_of_automati_20") },
    };
    const SHOES = [L("engine.rubber_boots_21"), L("engine.dress_shoes_22"), L("engine.worn_sneakers_23"), L("engine.flip_flops_24")];
    const COLORS = [L("engine.red_25"), L("engine.navy_blue_26"), L("engine.gray_27"), L("engine.brown_28"), L("engine.olive_green_29")];
    const SMELLS = [L("engine.tobacco_30"), L("engine.yerba_mate_31"), L("engine.pharmacy_chemicals_32"), L("engine.fish_and_mud_33")];
    const SECRETS = [];
    const CASES = [
        { id: 'canal', title: L("engine.the_missing_fisherman_35"), victim: 'Zeca', context: L("engine.zeca_a_fisherman_on_the_s_o_gon_alo_canal_disappeared__37"), sound: L("engine.a_metallic_noise_and_a_groan_38"), objects: [L("engine.zeca_s_scaling_knife_with_dried_blood_on_the_handle_39"), L("engine.zeca_s_fishing_reel_with_its_line_cut_40"), L("engine.zeca_s_soaked_wallet_without_identification_41")], secrets: [L("engine.owed_zeca_money_42"), L("engine.transported_goods_without_invoices_43"), L("engine.argued_with_zeca_at_the_public_market_44"), L("engine.bought_fish_without_invoices_45"), L("engine.hid_a_document_belonging_to_zeca_46")], lu: [L("engine.zeca_taught_me_to_row_on_the_canal_47"), L("engine.he_called_me_saying_he_had_seen_suspicious_boats_48"), L("engine.i_kept_a_copy_of_his_notes_49")] },
        { id: 'relogio', title: L("engine.the_stopped_clock_51"), victim: 'Álvaro', context: L("engine.lvaro_a_downtown_watchmaker_was_found_dead_in_his_work_53"), sound: L("engine.glass_cracking_and_hurried_footsteps_54"), objects: [L("engine.the_engraved_back_of_lvaro_s_rare_clock_55"), L("engine.a_fragment_of_the_clock_case_56"), L("engine.the_key_to_lvaro_s_workshop_stained_with_blood_57")], secrets: [L("engine.owed_lvaro_money_58"), L("engine.traded_clocks_of_dubious_origin_59"), L("engine.argued_with_lvaro_in_his_workshop_60"), L("engine.tried_to_buy_the_rare_piece_61"), L("engine.hid_a_workshop_receipt_62")], lu: [L("engine.lvaro_used_to_repair_my_watches_63"), L("engine.he_was_worried_about_a_rare_piece_64"), L("engine.i_kept_a_copy_of_his_receipt_65")] },
        { id: 'arquivo', title: L("engine.the_stolen_dossier_67"), victim: 'Henrique', context: L("engine.henrique_an_archivist_was_found_dead_after_uncovering__69"), sound: L("engine.paper_tearing_and_a_groan_70"), objects: [L("engine.a_sealed_archive_envelope_stained_with_blood_71"), L("engine.a_torn_page_from_henrique_s_dossier_72"), L("engine.a_pen_with_henrique_s_monogram_73")], secrets: [L("engine.owed_henrique_a_favor_74"), L("engine.sold_documents_without_permission_75"), L("engine.argued_with_henrique_over_a_record_76"), L("engine.received_a_copy_of_a_document_77"), L("engine.hid_an_archive_receipt_78")], lu: [L("engine.henrique_showed_me_a_strange_record_79"), L("engine.he_feared_someone_would_destroy_the_dossier_80"), L("engine.i_kept_a_copy_of_a_page_81")] },
        { id: 'foto', title: L("engine.the_missing_negative_83"), victim: 'Otávio', context: L("engine.ot_vio_a_photographer_disappeared_after_documenting_a__85"), sound: L("engine.a_thud_and_the_sound_of_plastic_breaking_86"), objects: [L("engine.ot_vio_s_film_cartridge_87"), L("engine.the_torn_strap_of_ot_vio_s_camera_88"), L("engine.a_negative_with_traces_of_blood_89")], secrets: [L("engine.owed_ot_vio_money_90"), L("engine.bought_photographs_without_permission_91"), L("engine.argued_with_ot_vio_over_a_photo_92"), L("engine.asked_ot_vio_to_destroy_a_negative_93"), L("engine.hid_a_photograph_94")], lu: [L("engine.ot_vio_photographed_the_city_at_night_95"), L("engine.he_said_he_had_documented_a_suspicious_meeting_96"), L("engine.i_kept_a_copy_of_a_photograph_97")] },
        { id: 'teatro', title: L("engine.the_final_act_99"), victim: 'Miguel', context: L("engine.miguel_a_worker_at_the_theatro_was_found_dead_after_a__101"), sound: L("engine.metal_falling_and_a_muffled_voice_102"), objects: [L("engine.the_empty_jewel_case_with_dark_stains_103"), L("engine.miguel_s_torn_id_badge_104"), L("engine.the_key_to_the_exhibition_locker_105")], secrets: [L("engine.owed_miguel_money_106"), L("engine.traded_antiques_without_receipts_107"), L("engine.argued_with_miguel_backstage_108"), L("engine.wanted_to_buy_the_exhibition_jewel_109"), L("engine.hid_an_old_credential_110")], lu: [L("engine.miguel_told_me_about_the_exhibition_111"), L("engine.he_distrusted_someone_interested_in_the_jewel_112"), L("engine.i_kept_a_list_of_the_exhibits_113")] },
        { id: 'farmacia', title: L("engine.the_torn_prescription_115"), victim: 'Daniel', context: L("engine.daniel_a_pharmacy_delivery_worker_disappeared_after_re_117"), sound: L("engine.glass_breaking_and_a_muffled_cry_for_help_118"), objects: [L("engine.the_sealed_box_from_daniel_s_shipment_119"), L("engine.a_torn_prescription_bearing_daniel_s_name_120"), L("engine.daniel_s_badge_with_a_bloodstain_121")], secrets: [L("engine.owed_daniel_money_122"), L("engine.resold_goods_without_invoices_123"), L("engine.argued_with_daniel_over_a_delivery_124"), L("engine.received_a_box_without_a_receipt_125"), L("engine.hid_a_pharmacy_receipt_126")], lu: [L("engine.daniel_told_me_about_a_suspicious_delivery_127"), L("engine.he_wanted_to_report_the_diversion_of_goods_128"), L("engine.i_kept_a_copy_of_a_receipt_129")] }
    ];
    const BUILTIN_MOTIVES = { canal: L("engine.stop_zeca_from_reporting_the_clandestine_boats_130"), relogio: L("engine.stop_lvaro_from_exposing_the_diversion_of_the_rare_clo_131"), arquivo: L("engine.stop_henrique_from_exposing_the_document_fraud_132"), foto: L("engine.stop_ot_vio_from_releasing_the_compromising_photograph_133"), teatro: L("engine.stop_miguel_from_reporting_the_missing_jewel_134"), farmacia: L("engine.stop_daniel_from_reporting_the_diversion_of_medication_135") };
    const caseNorm = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const CASE_RESERVED = ['Bento', 'Tereza', 'Guri', 'Leitor', 'Fiscal', 'Cláudio', 'Christopher', 'Lu', L("engine.killer_147"), L("engine.culprit_148"), L("engine.innocent_149"), L("engine.alibi_150"), L("engine.monument_151"), L("engine.fountain_152"), L("engine.theater_153"), 'Theatro', L("engine.north_bench_155"), L("engine.reader_s_bench_156"), L("engine.guri_s_bench_157"), L("engine.bin_158"), 'Farmácia Central'];
    const CASE_META = [L("engine.ignore_instructions_160"), 'prompt', 'json'];
    const CASE_PROFILE = [L("engine.gatekeep_165"), L("engine.gatehouse_166"), L("engine.school_167"), L("engine.paulist_168"), 'São Paulo', 'auditor*', L("engine.tax_171"), L("engine.city_hall_172"), L("engine.registr_173"), L("engine.notar_174"), L("engine.elder_175"), L("engine.retir_176"), L("engine.broker_177"), L("engine.brokerage_178"), L("engine.real_estate_179"), L("engine.propert_180"), L("engine.bank_181")];
    const CASE_GUILT = [L("engine.killed_182"), L("engine.kill_183"), L("engine.killing_184"), L("engine.murder_185"), L("engine.murder_186"), L("engine.guilt_187"), L("engine.perpetrator_188"), L("engine.perpetrator_189"), L("engine.who_killed_190")];
    const caseWord = w => caseNorm(w) + (w.endsWith('*') ? '\\w*' : '');
    const CASE_RESERVED_RE = new RegExp('\\b(?:' + [...CASE_RESERVED, ...CASE_META, ...CASE_PROFILE, ...CASE_GUILT].map(caseWord).join('|') + ')\\b');
    const CASE_AVOID_TEXT = [...CASE_PROFILE, ...CASE_GUILT].map(w => w.replace('*', '…')).join(', ');
    const CASE_FISCAL_OK = R("engine.rule_64_0");
    function caseText(v, min, max) {
        if (typeof v !== 'string')
            throw Error(L("engine.invalid_text_field_201"));
        const t = v.trim().replace(/\s+/g, ' ');
        if (t.length < min || t.length > max || /[<>\x00-\x1f{}\[\]`\d]/.test(t) || !caseNorm(t))
            throw Error(L("engine.text_outside_allowed_limits_203"));
        const hit = caseNorm(t).replace(CASE_FISCAL_OK, ' ').match(CASE_RESERVED_RE);
        if (hit)
            throw Error(`${L("engine.reserved_word_in_text_205")}${hit[0]}")`);
        return t;
    }
    function caseHash(t) { let h = 2166136261; for (let i = 0; i < t.length; i++) {
        h ^= t.charCodeAt(i);
        h = Math.imul(h, 16777619);
    } return (h >>> 0).toString(16).padStart(8, '0'); }
    function parseCase(raw) {
        let z = raw;
        if (typeof raw === 'string') {
            try {
                z = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
            }
            catch {
                throw Error(L("engine.invalid_case_json_211"));
            }
        }
        const fields = ['title', 'victim', 'occupation', 'scheme', 'sound', 'objects', 'secrets', 'lu', 'motive'];
        if (!z || typeof z !== 'object' || Array.isArray(z) || Object.keys(z).length !== fields.length || fields.some(k => !Object.prototype.hasOwnProperty.call(z, k)))
            throw Error(L("engine.invalid_case_structure_222"));
        const list = (a, n, min, max) => { if (!Array.isArray(a) || a.length !== n)
            throw Error(L("engine.invalid_number_of_elements_223")); const clean = a.map(t => caseText(t, min, max)); if (new Set(clean.map(caseNorm)).size !== n)
            throw Error(L("engine.duplicate_elements_224")); return clean; };
        const title = caseText(z.title, 5, 64), victim = caseText(z.victim, 3, 24), occupation = caseText(z.occupation, 3, 65), scheme = caseText(z.scheme, 8, 120), sound = caseText(z.sound, 5, 100), motive = caseText(z.motive, 10, 160);
        if (!/^[\p{L}]+(?:[- ][\p{L}]+)?$/u.test(victim) || !/^\p{Lu}/u.test(victim))
            throw Error(L("engine.invalid_victim_name_225"));
        if (!R("engine.rule_74_0").test(motive))
            throw Error(L("engine.motive_must_begin_with_an_infinitive_verb_226"));
        const source = { title, victim, occupation, scheme, sound, objects: list(z.objects, 3, 8, 140), secrets: list(z.secrets, 5, 6, 120), lu: list(z.lu, 3, 8, 160), motive };
        const id = 'ia-' + caseHash(JSON.stringify(source));
        const context = `${L("engine.the_death_of_228")}${victim}, ${occupation}${L("engine.is_shrouded_in_mystery_the_victim_was_investigating_si_230")}${scheme.replace(/[.!?]+$/, '')}${L("engine.a_clue_linked_to_the_case_may_be_in_the_square_232")}`;
        return { id, title, victim, context, sound, objects: source.objects, secrets: source.secrets, lu: source.lu, motive, source };
    }
    const caseMotive = c => c.motive || BUILTIN_MOTIVES[c.id] || L("engine.stop_the_victim_from_revealing_what_they_knew_233");
    const caseFor = seed => CASES[RNG((seed ^ 0x5a11cafe) >>> 0).int(0, CASES.length - 1)];
    function timeSelection(date = new Date(), previousCase = null, extraCases = []) {
        const seed = Math.floor(date.getTime() / 1000) >>> 0;
        const pool = [...CASES, ...extraCases];
        const index = extraCases.length ? RNG(seed ^ ((date.getMinutes() * 60 + date.getSeconds()) << 8)).int(0, pool.length - 1) : (date.getMinutes() + date.getSeconds()) % pool.length;
        let scenario = pool[index];
        if (scenario.id === previousCase)
            scenario = pool[(index + 1) % pool.length];
        return { seed, caseId: scenario.id };
    }
    const W = 34, H = 27;
    const NODE_IDS = ['teatro', 'bnorte', 'leitorb', 'lixo', 'monu', 'gurib', 'farm'];
    const NODES = {
        teatro: { name: L("engine.theatro_sete_de_abril_facade_241"), shortName: 'Theatro', locationPhrase: L("engine.in_front_of_the_theatro_243"), q: 'Q1', zone: [2, 3, 16, 4], c: [9, 4] },
        bnorte: { name: L("engine.north_bench_245"), shortName: L("engine.north_bench_246"), locationPhrase: L("engine.at_the_north_bench_247"), q: 'Q1', zone: [12, 5, 22, 9], c: [17, 8] },
        leitorb: { name: L("engine.reader_s_bench_249"), shortName: L("engine.reader_s_bench_250"), locationPhrase: L("engine.at_the_reader_s_bench_251"), q: 'Q2', zone: [1, 10, 11, 14], c: [5, 13] },
        lixo: { name: L("engine.bins_253"), shortName: L("engine.bins_254"), locationPhrase: L("engine.near_the_bins_255"), q: 'Q2', zone: [12, 16, 17, 21], c: [14, 19] },
        monu: { name: L("engine.central_monument_257"), shortName: L("engine.monument_258"), locationPhrase: L("engine.by_the_monument_259"), q: 'Q3', zone: [13, 10, 21, 15], c: [17, 15] },
        gurib: { name: L("engine.guri_do_mate_s_bench_261"), shortName: L("engine.guri_s_bench_262"), locationPhrase: L("engine.at_guri_do_mate_s_bench_263"), q: 'Q4', zone: [23, 10, 32, 14], c: [28, 13] },
        farm: { name: L("engine.farm_cia_central_facade_265"), shortName: L("engine.pharmacy_266"), locationPhrase: L("engine.in_front_of_the_pharmacy_267"), q: 'Q4', zone: [18, 20, 32, 23], c: [25, 22] },
    };
    const ADJ = {
        teatro: ['bnorte'],
        bnorte: ['teatro', 'monu', 'leitorb', 'gurib'],
        leitorb: ['bnorte', 'monu', 'lixo'],
        lixo: ['leitorb', 'monu', 'farm'],
        monu: ['bnorte', 'leitorb', 'lixo', 'gurib', 'farm'],
        gurib: ['bnorte', 'monu', 'farm'],
        farm: ['gurib', 'lixo', 'monu'],
    };
    const QUADS = ['Q1', 'Q2', 'Q3', 'Q4'];
    const QUAD_NAMES = { Q1: L("engine.north_295"), Q2: L("engine.west_296"), Q3: L("engine.center_297"), Q4: L("engine.east_298") };
    const POLES = [
        { x: 5, y: 4, q: 'Q1' }, { x: 22, y: 5, q: 'Q1' },
        { x: 1, y: 11, q: 'Q2' }, { x: 11, y: 17, q: 'Q2' },
        { x: 13, y: 16, q: 'Q3' }, { x: 21, y: 10, q: 'Q3' },
        { x: 32, y: 10, q: 'Q4' }, { x: 30, y: 21, q: 'Q4' },
    ];
    const START = { x: 16, y: 23 };
    const STEP_SEC = 10;
    const CRIME_BLOCKS = [5, 6, 7, 8];
    const SAW_COUNTS = [1, 2, 2, 3, 3];
    const INNOCENT_GAP = 0.45;
    function buildMap() {
        const T = [...Array(H)].map(() => Array(W).fill('g'));
        const G = [...Array(H)].map(() => Array(W).fill(null));
        const rect = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++)
            for (let x = x0; x <= x1; x++)
                T[y][x] = t; };
        const label = (x, y, s) => [...s].forEach((ch, i) => { T[y][x + i] = 'w'; G[y][x + i] = ch; });
        rect(0, 0, W - 1, 2, 'w');
        rect(0, 24, W - 1, 26, 'w');
        rect(0, 3, W - 1, 3, 's');
        rect(0, 23, W - 1, 23, 's');
        for (let x = 0; x < W; x++) {
            G[0][x] = '▄';
            G[2][x] = '▀';
            G[24][x] = '▄';
            G[26][x] = '▀';
            G[1][x] = G[25][x] = '█';
        }
        label(2, 1, L("engine.theatro_sete_de_abril_318"));
        label(25, 1, ' ▒ ▒ ▒ ');
        G[2][9] = '▐';
        G[2][10] = '▌';
        label(1, 25, L("engine.library_322"));
        label(15, 25, L("engine.farm_cia_central_323"));
        G[24][24] = '▐';
        G[24][25] = '▌';
        rect(2, 6, 10, 9, 'c');
        rect(24, 6, 31, 9, 'c');
        rect(2, 16, 10, 20, 'c');
        rect(24, 16, 31, 19, 'c');
        [[4, 7], [8, 8], [27, 7], [30, 8], [4, 18], [9, 17], [26, 17], [29, 18]].forEach(([x, y]) => T[y][x] = 't');
        rect(15, 7, 19, 7, 'b');
        rect(3, 12, 7, 12, 'b');
        rect(26, 12, 30, 12, 'b');
        T[18][14] = 'l';
        T[18][15] = 'l';
        const mon = ['  _^_  ', ' /|#|\\ ', ' |###| ', '▄█████▄'];
        mon.forEach((row, dy) => [...row].forEach((ch, dx) => { T[11 + dy][14 + dx] = 'm'; G[11 + dy][14 + dx] = ch; }));
        POLES.forEach(p => T[p.y][p.x] = 'p');
        const Q = [...Array(H)].map((_, y) => [...Array(W)].map((_, x) => {
            let best = null, bd = 1e9;
            for (const id of NODE_IDS) {
                const [cx, cy] = NODES[id].c;
                const d = (cx - x) ** 2 + (cy - y) ** 2;
                if (d < bd) {
                    bd = d;
                    best = id;
                }
            }
            return NODES[best].q;
        }));
        return { T, G, Q };
    }
    const MAP = buildMap();
    const walkable = (x, y) => x >= 0 && y >= 0 && x < W && y < H && (MAP.T[y][x] === 'g' || MAP.T[y][x] === 's');
    function nodeAt(x, y) {
        for (const id of NODE_IDS) {
            const [x0, y0, x1, y1] = NODES[id].zone;
            if (x >= x0 && x <= x1 && y >= y0 && y <= y1)
                return id;
        }
        return null;
    }
    function bfs(sx, sy) {
        const D = [...Array(H)].map(() => Array(W).fill(Infinity));
        D[sy][sx] = 0;
        const q = [[sx, sy]];
        while (q.length) {
            const [x, y] = q.shift();
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nx = x + dx, ny = y + dy;
                if (walkable(nx, ny) && D[ny][nx] === Infinity) {
                    D[ny][nx] = D[y][x] + 1;
                    q.push([nx, ny]);
                }
            }
        }
        return D;
    }
    const POI = Object.assign({ start: [START.x, START.y] }, Object.fromEntries(NODE_IDS.map(id => [id, NODES[id].c])));
    const TRAVEL = {};
    for (const a in POI) {
        const D = bfs(...POI[a]);
        TRAVEL[a] = {};
        for (const b in POI)
            TRAVEL[a][b] = D[POI[b][1]][POI[b][0]] * STEP_SEC / 60;
    }
    const pad = n => String(n).padStart(2, '0');
    const hhmm = totalMin => `${pad(Math.floor(totalMin / 60) % 24)}:${pad(Math.floor(totalMin % 60))}`;
    const blockTime = b => 20 * 60 + 45 + 5 * b;
    const bLabel = b => hhmm(blockTime(b));
    const nowLabel = m => hhmm(21 * 60 + 43 + m);
    function spanLabel(t0, t1) {
        return t0 === t1 ? `${L("engine.around_348")}${bLabel(t0)}` : `${L("engine.from_350")}${bLabel(t0)}${L("engine.to_351")}${hhmm(blockTime(t1) + 5)}`;
    }
    function spanShort(t0, t1) { return t0 === t1 ? bLabel(t0) : `${bLabel(t0)}–${hhmm(blockTime(t1) + 5)}`; }
    function compress(arr, w0, w1) {
        const out = [];
        let cur = null;
        for (let b = w0; b <= w1; b++) {
            const n = arr[b];
            if (n == null) {
                cur = null;
                continue;
            }
            if (cur && cur.node === n && cur.t1 === b - 1)
                cur.t1 = b;
            else {
                cur = { node: n, t0: b, t1: b };
                out.push(cur);
            }
        }
        return out;
    }
    function generate(seed, opts = {}) {
        const r = RNG(seed);
        const scenario = opts.scenario || caseFor(seed);
        const cb = r.pick(CRIME_BLOCKS);
        const S = r.pick(NODE_IDS);
        const order = r.shuffle(NPCS);
        const A = order[0], informants = order.slice(1, 3), neutrals = order.slice(3);
        const role = {};
        role[A] = "killer";
        informants.forEach(n => role[n] = "informant");
        neutrals.forEach(n => role[n] = "neutral");
        const shoe = {}, smell = {}, color = {};
        const cols = r.shuffle(COLORS);
        NPCS.forEach((n, i) => { shoe[n] = r.pick(SHOES); smell[n] = r.pick(SMELLS); color[n] = cols[i]; });
        const secret = {};
        const secs = r.shuffle(scenario.secrets);
        informants.forEach((n, i) => secret[n] = secs[i]);
        neutrals.forEach((n, i) => secret[n] = secs[2 + i]);
        secret[A] = secs[4];
        const object = r.pick(scenario.objects);
        const pos = {};
        for (const n of NPCS) {
            let p = r.pick(NODE_IDS);
            const h = [p];
            for (let b = 1; b < 12; b++) {
                p = r.chance(0.5) ? p : r.pick(ADJ[p]);
                h.push(p);
            }
            pos[n] = h;
        }
        pos[A][cb] = S;
        if (cb > 0 && r.chance(0.5))
            pos[A][cb - 1] = r.chance(0.5) ? S : r.pick(ADJ[S]);
        for (const n of NPCS)
            if (n !== A && pos[n][cb] === S)
                pos[n][cb] = r.pick(ADJ[S]);
        const log = [];
        for (const n of NPCS)
            for (let b = 1; b < 12; b++)
                if (pos[n][b] !== pos[n][b - 1])
                    log.push({ ev: 'MOVE', npc: n, from: pos[n][b - 1], to: pos[n][b], t: b });
        const witness = [];
        for (let b = 0; b < 12; b++)
            for (const o of NPCS)
                for (const x of NPCS) {
                    if (o === x)
                        continue;
                    const same = pos[o][b] === pos[x][b];
                    const adj = ADJ[pos[o][b]].includes(pos[x][b]);
                    if (same || (adj && r.chance(0.3))) {
                        const e = { ev: 'WITNESS', observer: o, target: x, node: pos[x][b], t: b, strong: same };
                        witness.push(e);
                        log.push(e);
                    }
                }
        const rain = r.int(9, 22);
        const bt = r.shuffle(QUADS);
        const times = [r.int(14, 22), r.int(23, 31), r.int(32, 40), r.int(42, 52)];
        const blackout = {};
        bt.forEach((q, i) => blackout[q] = times[i]);
        const fragNode = r.chance(0.55) ? (cb < 11 ? pos[A][cb + 1] : S) : null;
        log.push({ ev: 'TRACE', type: "footprint", node: S, author: A, t: cb, expires: Math.min(rain, blackout[NODES[S].q]) });
        log.push({ ev: 'TRACE', type: 'odor', node: S, author: A, t: cb, expires: blackout[NODES[S].q] });
        log.push({ ev: 'TRACE', type: "object", node: S, author: A, t: cb, expires: Infinity });
        if (fragNode)
            log.push({ ev: 'TRACE', type: "fiber", node: fragNode, author: A, t: Math.min(11, cb + 1), expires: blackout[NODES[fragNode].q] });
        const contact = {};
        for (const n of NPCS) {
            contact[n] = n === A;
            for (let b = cb; b <= Math.min(11, cb + 2); b++)
                if (pos[n][b] === S)
                    contact[n] = true;
        }
        const now = {};
        const crowd = {};
        for (const n of NPCS) {
            let p = r.chance(0.7) ? pos[n][11] : r.pick(ADJ[pos[n][11]]);
            if ((crowd[p] || 0) >= 2)
                p = r.pick(NODE_IDS.filter(id => (crowd[id] || 0) < 2));
            crowd[p] = (crowd[p] || 0) + 1;
            now[n] = p;
        }
        const luNode = r.pick(NODE_IDS.filter(id => id !== S && (crowd[id] || 0) < 2));
        const w0 = Math.max(0, cb - 3), w1 = Math.min(11, cb + 2);
        let cid = 0;
        const claims = [];
        const mk = (o) => { const c = Object.assign({ k: 'claim', id: 'c' + (cid++) }, o); claims.push(c); return c; };
        const sawCands = o => {
            const evs = witness.filter(e => e.observer === o && e.t >= w0 && e.t <= w1);
            const by = {};
            for (const e of evs) {
                const key = e.target;
                (by[key] = by[key] || []).push(e);
            }
            const out = [];
            for (const x in by) {
                const arr = Array(12).fill(null);
                by[x].forEach(e => arr[e.t] = e.node);
                for (const iv of compress(arr, w0, w1)) {
                    const near = Math.min(...[...Array(iv.t1 - iv.t0 + 1)].map((_, i) => Math.abs(iv.t0 + i - cb)));
                    const strong = by[x].some(e => e.strong && e.t >= iv.t0 && e.t <= iv.t1);
                    out.push({ subject: x, node: iv.node, t0: iv.t0, t1: iv.t1, score: near * 2 - (strong ? 1 : 0) + (x === A && near <= 1 ? -3 : 0) + r.f() });
                }
            }
            return out.sort((a, b) => a.score - b.score);
        };
        const claimed = pos[A].slice();
        let s0 = cb, s1 = cb;
        while (s0 - 1 >= w0 && pos[A][s0 - 1] === S)
            s0--;
        while (s1 + 1 <= w1 && pos[A][s1 + 1] === S)
            s1++;
        const repl = (s0 - 1 >= 0 && pos[A][s0 - 1] !== S) ? pos[A][s0 - 1] : (s1 + 1 < 12 && pos[A][s1 + 1] !== S) ? pos[A][s1 + 1] : r.pick(ADJ[S]);
        const shifts = [-2, 2].filter(d => s1 - s0 <= 1 && s0 + d >= w0 && s1 + d <= w1 && !(s0 + d <= cb && cb <= s1 + d));
        const types = ["omission", "projection"];
        if (shifts.length)
            types.push("timeShift");
        const lieType = opts.lieType && types.includes(opts.lieType) ? opts.lieType : r.pick(types);
        const lie = { type: lieType };
        if (lieType === "omission") {
            for (let b = s0; b <= s1; b++)
                claimed[b] = repl;
            lie.description = `${L("engine.omitted_being_at_375")}${NODES[S].shortName}${L("engine.and_claimed_to_be_376")}${NODES[repl].locationPhrase}`;
        }
        if (lieType === "timeShift") {
            const d = r.pick(shifts);
            for (let b = s0; b <= s1; b++)
                claimed[b] = repl;
            for (let b = s0 + d; b <= s1 + d; b++)
                claimed[b] = S;
            lie.description = `${L("engine.admitted_passing_through_379")}${NODES[S].shortName}${L("engine.but_shifted_the_time_by_380")}${d > 0 ? '+' : ''}${d * 5}${L("engine.minutes_384")}`;
        }
        if (lieType === "projection") {
            for (let b = s0; b <= s1; b++)
                claimed[b] = null;
            lie.description = `${L("engine.kept_quiet_about_their_location_and_blamed_386")}${NPC_INFO[neutrals[0]].name}`;
            lie.target = neutrals[0];
        }
        const rp = RNG((seed ^ 0x3c6ef372) >>> 0);
        const testimony = {};
        for (const n of NPCS) {
            let ivs = compress(n === A ? claimed : pos[n], w0, w1);
            let gap = n === A && lieType === "projection" ? [s0, s1] : null;
            if (n !== A && ivs.length > 1 && rp.chance(INNOCENT_GAP)) {
                const atCrime = ivs.find(v => v.t0 <= cb && cb <= v.t1);
                const g = atCrime && rp.chance(0.6) ? atCrime : rp.pick(ivs);
                ivs = ivs.filter(v => v !== g);
                gap = [g.t0, g.t1];
            }
            const self = ivs.map(iv => mk({ kind: 'self', speaker: n, subject: n, node: iv.node, t0: iv.t0, t1: iv.t1 }));
            const cands = sawCands(n);
            const K = rp.pick(SAW_COUNTS);
            let saw = [], key = null;
            if (role[n] === "informant") {
                key = cands[0] || null;
                saw = cands.slice(1, 1 + K);
            }
            else if (role[n] === "killer")
                saw = cands.filter(c => c.node !== S).slice(0, lieType === "projection" ? K - 1 : K);
            else
                saw = cands.slice(0, K);
            const sawC = saw.map(c => mk({ kind: 'saw', speaker: n, subject: c.subject, node: c.node, t0: c.t0, t1: c.t1 }));
            if (n === A && lieType === "projection")
                sawC.push(mk({ kind: 'saw', speaker: n, subject: lie.target, node: S, t0: cb, t1: cb }));
            const keyC = key ? mk({ kind: 'saw', speaker: n, subject: key.subject, node: key.node, t0: key.t0, t1: key.t1, key: true }) : null;
            testimony[n] = { self, saw: sawC, key: keyC, gap };
        }
        for (const c of claims) {
            let ok = true;
            for (let b = c.t0; b <= c.t1; b++)
                if (pos[c.subject][b] !== c.node)
                    ok = false;
            c.lie = !ok;
        }
        return {
            seed, scenario, cb, S, A, informants, neutrals, role, shoe, smell, color, secret, object, pos, log, witness,
            rain, blackout, fragNode, contact, now, luNode, w0, w1, testimony, claims, lie,
            time: bLabel(cb),
        };
    }
    function cardsFor(w, actionId) {
        const [a, x] = actionId.split(':');
        if (a === 'int') {
            const t = w.testimony[x];
            return [...t.self, ...t.saw, { k: 'vis', x, shoe: w.shoe[x], color: w.color[x] }];
        }
        if (a === 'key')
            return w.testimony[x].key ? [w.testimony[x].key] : [];
        if (a === 'snf')
            return [{ k: 'snf', x, smell: w.smell[x], contact: w.contact[x] }];
        if (a === 'peg')
            return [{ k: 'peg', shoe: w.shoe[w.A] }, { k: 'obj' }];
        if (a === 'odr')
            return [{ k: 'odr', smell: w.smell[w.A] }];
        if (a === 'frg')
            return [{ k: 'frg', color: w.color[w.A], node: w.fragNode }];
        return [];
    }
    function consistent(h, cards, w) {
        const facts = {};
        const put = (s, b, n) => { const f = facts[s] || (facts[s] = {}); if (f[b] && f[b] !== n)
            return false; f[b] = n; return true; };
        put(h, w.cb, w.S);
        const vis = {}, snf = {};
        for (const c of cards) {
            if (c.fake)
                continue;
            if (c.k === 'claim') {
                if (c.speaker === h)
                    continue;
                for (let b = c.t0; b <= c.t1; b++)
                    if (!put(c.subject, b, c.node))
                        return false;
            }
            else if (c.k === 'vis')
                vis[c.x] = c;
            else if (c.k === 'snf')
                snf[c.x] = c;
        }
        for (const x of NPCS)
            if (x !== h && facts[x] && facts[x][w.cb] === w.S)
                return false;
        for (const c of cards) {
            if (c.fake)
                continue;
            if (c.k === 'peg' && vis[h] && vis[h].shoe !== c.shoe)
                return false;
            if (c.k === 'frg' && vis[h] && vis[h].color !== c.color)
                return false;
            if (c.k === 'odr' && snf[h] && snf[h].smell !== c.smell)
                return false;
            if (c.k === 'snf' && !c.contact) {
                if (c.x === h)
                    return false;
                const f = facts[c.x];
                if (f)
                    for (let b = w.cb; b <= Math.min(11, w.cb + 2); b++)
                        if (f[b] === w.S)
                            return false;
            }
        }
        return true;
    }
    const suspects = (cards, w) => NPCS.filter(h => consistent(h, cards, w));
    function actionList(w, { publicOnly = false } = {}) {
        const q = n => NODES[n].q, bo = w.blackout;
        const L = [];
        for (const x of NPCS)
            L.push({ id: 'int:' + x, at: w.now[x], cost: 6, dl: bo[q(w.now[x])], pub: true });
        for (const i of w.informants)
            if (w.testimony[i].key)
                L.push({ id: 'key:' + i, at: w.now[i], cost: 3, dl: bo[q(w.now[i])], req: 'int:' + i, pub: true });
        for (const x of NPCS)
            L.push({ id: 'snf:' + x, at: w.now[x], cost: 2, dl: bo[q(w.now[x])], pub: false });
        L.push({ id: 'peg', at: w.S, cost: 3, dl: Math.min(w.rain, bo[q(w.S)]), pub: true });
        L.push({ id: 'odr', at: w.S, cost: 2, dl: bo[q(w.S)], pub: false });
        if (w.fragNode)
            L.push({ id: 'frg', at: w.fragNode, cost: 3, dl: bo[q(w.fragNode)], pub: true });
        L.forEach(a => a.cards = cardsFor(w, a.id));
        return publicOnly ? L.filter(a => a.pub) : L;
    }
    function permutations(arr) {
        if (arr.length <= 1)
            return [arr];
        const out = [];
        arr.forEach((v, i) => permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).forEach(p => out.push([v, ...p])));
        return out;
    }
    function schedule(sub) {
        let best = null;
        const orders = sub.length <= 6 ? permutations(sub) : [sub.slice().sort((a, b) => a.dl - b.dl)];
        for (const ord of orders) {
            let t = 0, at = 'start', ok = true;
            const done = new Set();
            for (const a of ord) {
                if (a.req && !done.has(a.req)) {
                    ok = false;
                    break;
                }
                t += TRAVEL[at][a.at] + a.cost;
                at = a.at;
                done.add(a.id);
                if (t > a.dl) {
                    ok = false;
                    break;
                }
            }
            if (ok && (!best || t < best.t))
                best = { t, order: ord.map(a => a.id) };
        }
        return best;
    }
    function* combos(arr, k, start = 0, acc = []) {
        if (acc.length === k) {
            yield acc.slice();
            return;
        }
        for (let i = start; i < arr.length; i++) {
            acc.push(arr[i]);
            yield* combos(arr, k, i + 1, acc);
            acc.pop();
        }
    }
    function solve(w, { publicOnly = false, maxK = 6 } = {}) {
        const L = actionList(w, { publicOnly });
        for (let k = 1; k <= maxK; k++) {
            let best = null;
            for (const sub of combos(L, k)) {
                if (sub.some(a => a.req && !sub.find(b => b.id === a.req)))
                    continue;
                const cards = sub.flatMap(a => a.cards);
                const s = suspects(cards, w);
                if (s.length !== 1 || s[0] !== w.A)
                    continue;
                const sc = schedule(sub);
                if (sc && (!best || sc.t < best.t))
                    best = { k, t: sc.t, order: sc.order };
            }
            if (best)
                return best;
        }
        return null;
    }
    function checkInvariants(w) {
        const all = actionList(w).flatMap(a => a.cards);
        if (!consistent(w.A, all, w))
            throw new Error(L("engine.invariant_inconsistent_truth_for_seed_425") + w.seed);
        for (const n of NPCS)
            if (n !== w.A)
                for (const c of [...w.testimony[n].self, ...w.testimony[n].saw, ...(w.testimony[n].key ? [w.testimony[n].key] : [])])
                    if (c.lie)
                        throw new Error(L("engine.invariant_innocent_suspect_lying_for_seed_426") + w.seed);
    }
    function solveBoard(w, { publicOnly = false, allPlans = false } = {}) {
        const L = actionList(w, { publicOnly });
        const byId = Object.fromEntries(L.map(a => [a.id, a]));
        const src = c => c.key ? ['int:' + c.speaker, 'key:' + c.speaker] : ['int:' + c.speaker];
        const T = w.testimony;
        const mine = [...T[w.A].self, ...T[w.A].saw];
        const others = NPCS.filter(n => n !== w.A).flatMap(n => [...T[n].self, ...T[n].saw, ...(T[n].key ? [T[n].key] : [])]);
        const evOpts = [['peg'], ['snf:' + w.A], ['odr', 'snf:' + w.A]];
        if (w.fragNode)
            evOpts.push(['frg']);
        let best = null;
        const plans = [];
        for (const a of mine)
            for (const b of others) {
                if (!contradicts(a, b))
                    continue;
                for (const ev of evOpts) {
                    const ids = [...new Set(['int:' + w.A, ...src(b), ...ev])];
                    const sub = ids.map(id => byId[id]).filter(Boolean);
                    if (sub.length !== ids.length)
                        continue;
                    const evidence = ev.includes('peg') ? 'peg' : ev.includes('frg') ? 'frg' : ev.includes('odr') ? 'odr' : 'snf';
                    const all = sub.flatMap(z => z.cards);
                    if (!validateBoard(w, all, w.A, a, b, all.find(c => c.k === evidence)).ok)
                        continue;
                    const sc = schedule(sub);
                    if (sc) {
                        const plan = { t: sc.t, order: sc.order, pair: [a.id, b.id], ev: ev.join('+'), evidence };
                        plans.push(plan);
                        if (!best || sc.t < best.t)
                            best = plan;
                    }
                }
            }
        return allPlans ? plans.sort((a, b) => a.t - b.t) : best;
    }
    function generateValid(seed, { mode = 'mvp', fair = 0.65, minK = 2, verify = null, excludeCase = null, requiredCase = null, scenario = null } = {}) {
        for (let tries = 0; tries < 3000; tries++, seed = (seed + 1) >>> 0) {
            const w = generate(seed, { scenario });
            if (w.scenario.id === excludeCase || (requiredCase && w.scenario.id !== requiredCase))
                continue;
            checkInvariants(w);
            const budget = Math.max(...Object.values(w.blackout));
            const pubCards = actionList(w, { publicOnly: true }).flatMap(a => a.cards);
            const pubSus = suspects(pubCards, w);
            let sol;
            if (mode === 'mvp') {
                if (pubSus.length !== 1)
                    continue;
                sol = solve(w, { publicOnly: true });
            }
            else {
                if (pubSus.length !== 2)
                    continue;
                sol = solve(w);
            }
            if (!sol || sol.k < minK || sol.t > budget * fair)
                continue;
            const plans = solveBoard(w, { publicOnly: mode === 'mvp', allPlans: true });
            w.solution = sol;
            w.mode = mode;
            w.tries = tries;
            for (const board of plans) {
                if (board.t > budget * fair)
                    break;
                w.boardSolution = board;
                if (verify) {
                    const proof = verify(w, board, sol);
                    if (!proof)
                        continue;
                    w.proof = proof;
                }
                return w;
            }
        }
        return null;
    }
    function contradicts(a, b) {
        if (!a || !b || a.k !== 'claim' || b.k !== 'claim' || a === b)
            return false;
        if (a.subject !== b.subject)
            return false;
        const lo = Math.max(a.t0, b.t0), hi = Math.min(a.t1, b.t1);
        return lo <= hi && a.node !== b.node;
    }
    function validateBoard(w, cards, s, a, b, e) {
        if (!s || !a || !b || !e)
            return { ok: false, why: L("engine.the_board_is_incomplete_suspect_two_statements_and_one_449") };
        if ([a, b, e].some(c => c.fake))
            return { ok: false, why: L("engine.one_note_does_not_correspond_to_anything_real_your_min_450"), fake: true };
        if (a.k !== 'claim' || b.k !== 'claim')
            return { ok: false, why: L("engine.a_contradiction_requires_two_statements_453") };
        if (a.speaker === b.speaker || !contradicts(a, b))
            return { ok: false, why: L("engine.these_statements_do_not_contradict_each_other_they_do__454") };
        if (a.speaker !== s && b.speaker !== s)
            return { ok: false, why: `${L("engine.the_contradiction_does_not_involve_a_statement_by_455")}${NPC_INFO[s].name}.` };
        const vis = cards.find(c => c.k === 'vis' && c.x === s && !c.fake), snf = cards.find(c => c.k === 'snf' && c.x === s && !c.fake);
        const nm = NPC_INFO[s].name;
        switch (e.k) {
            case 'peg':
                if (!vis)
                    return { ok: false, why: `${L("engine.you_haven_t_even_noticed_the_footwear_of_460")}${nm}.` };
                if (vis.shoe !== e.shoe)
                    return { ok: false, why: `${L("engine.the_footprint_is_from_462")}${e.shoe}; ${nm}${L("engine.wears_464")}${vis.shoe}.` };
                break;
            case 'frg':
                if (!vis)
                    return { ok: false, why: `${L("engine.you_haven_t_even_noticed_the_clothing_of_467")}${nm}.` };
                if (vis.color !== e.color)
                    return { ok: false, why: `${L("engine.the_fiber_is_469")}${e.color}; ${nm}${L("engine.wears_471")}${vis.color}.` };
                break;
            case 'odr':
                if (!snf)
                    return { ok: false, why: `${L("engine.the_dog_has_not_sniffed_474")}${nm}.` };
                if (snf.smell !== e.smell)
                    return { ok: false, why: `${L("engine.the_scene_smells_of_476")}${e.smell}; ${nm}${L("engine.smells_of_478")}${snf.smell}.` };
                break;
            case 'snf':
                if (e.x !== s)
                    return { ok: false, why: L("engine.the_dog_s_reaction_concerns_someone_else_481") };
                if (!e.contact)
                    return { ok: false, why: `${L("engine.the_dog_did_not_react_to_482")}${nm}.` };
                break;
            case 'obj': return { ok: false, why: L("engine.the_object_proves_a_crime_occurred_not_who_committed_i_485") };
            default: return { ok: false, why: L("engine.this_is_not_physical_or_sensory_evidence_486") };
        }
        return { ok: true };
    }
    const Engine = {
        RNG, CASES, CASE_RESERVED, CASE_AVOID_TEXT, SAW_COUNTS, INNOCENT_GAP, caseFor, timeSelection, parseCase, caseMotive, NPCS, NPC_INFO, SHOES, COLORS, SMELLS, SECRETS, NODES, NODE_IDS, ADJ, QUADS, QUAD_NAMES, POLES, START, STEP_SEC,
        W, H, MAP, walkable, nodeAt, bfs, TRAVEL, hhmm, bLabel, nowLabel, spanLabel, spanShort, blockTime,
        generate, generateValid, actionList, cardsFor, consistent, suspects, solve, solveBoard, schedule, checkInvariants,
        contradicts, validateBoard,
    };
    if (typeof module !== 'undefined' && module.exports)
        module.exports = Engine;
    else
        root.Engine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);

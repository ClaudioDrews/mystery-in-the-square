/* Gameplay, social and strategic behavior, and route verification. */
(function (root) {
    'use strict';
    const { t: L, regex: R, language } = typeof module !== 'undefined' && module.exports ? require('./localization.js') : root.Localization;
    const E = (typeof module !== 'undefined' && module.exports) ? require('./engine.js') : root.Engine;
    const { NPCS, NPC_INFO, NODES, NODE_IDS, QUADS, QUAD_NAMES, MAP, W, H } = E;
    const nm = x => x === 'lu' ? 'Lu' : NPC_INFO[x].name;
    const VOICES = {
        bento: { prefix: [L("game.look_494"), L("game.so_look_495"), L("game.son_496")], key: [L("game.all_right_but_keep_this_between_us_497"), L("game.i_ll_only_say_this_once_okay_498"), L("game.listen_no_fuss_499")], empty: [L("game.didn_t_notice_at_the_school_gate_you_learn_not_to_gues_500"), L("game.i_don_t_know_son_i_m_not_making_things_up_501"), L("game.can_t_help_you_with_that_502")], greet: [L("game.yes_son_503"), L("game.hey_need_something_504"), L("game.looking_for_someone_505")], banter: [L("game.in_s_o_paulo_you_learn_to_walk_fast_here_even_the_cloc_506"), L("game.at_the_school_gate_the_trick_is_recognizing_who_comes__507"), L("game.from_s_o_paulo_to_here_well_long_story_best_leave_it_t_508")], topic: L("game.how_did_you_end_up_in_pelotas_509"), match: R("game.rule_16_0"), pressure: L("game.son_i_know_how_to_shut_a_gate_i_can_t_work_miracles_510"), accuse: L("game.hold_on_son_think_about_what_you_re_saying_511") },
        fiscal: { prefix: [L("game.objectively_512"), L("game.write_this_down_correctly_513"), L("game.the_information_is_as_follows_514")], key: [L("game.since_you_insist_pay_attention_515"), L("game.record_this_without_distortion_516"), L("game.i_will_be_precise_517")], empty: [L("game.i_have_no_such_information_next_question_518"), L("game.no_record_assumptions_are_not_data_519"), L("game.had_i_observed_it_i_would_have_recorded_it_520")], greet: [L("game.be_brief_521"), L("game.i_expect_an_objective_question_522"), L("game.i_don_t_have_all_night_523")], banter: [L("game.if_every_merchant_understood_a_line_of_the_tax_code_my_524"), L("game.everyone_wants_urban_improvements_nobody_wants_to_pay__525"), L("game.the_difference_between_a_guess_and_a_formal_opinion_is_526")], topic: L("game.what_do_you_think_of_the_city_s_administration_527"), match: R("game.rule_17_0"), pressure: L("game.repeating_the_question_does_not_create_new_information_528"), accuse: L("game.present_your_reasoning_i_have_no_patience_for_vague_ac_529") },
        tereza: { prefix: [L("game.my_dear_530"), L("game.listen_sweetheart_531"), L("game.ah_i_remember_532")], key: [L("game.come_closer_my_dear_533"), L("game.i_ll_tell_you_quietly_534"), L("game.between_you_and_me_dear_535")], empty: [L("game.oh_my_dear_i_can_t_be_sure_of_that_536"), L("game.i_d_love_to_help_dear_but_i_didn_t_see_537"), L("game.not_everything_we_hear_deserves_to_make_the_news_you_k_538")], greet: [L("game.hello_my_dear_why_the_serious_face_539"), L("game.come_here_dear_sit_for_a_bit_540"), L("game.mind_your_coat_dear_it_s_damp_541")], banter: [L("game.a_walk_and_a_little_chat_are_better_than_staring_at_wa_542"), L("game.my_father_used_to_say_that_what_is_missing_from_the_re_543"), L("game.i_ve_known_so_many_people_who_held_their_heads_high_bu_544")], topic: L("game.do_you_know_the_old_stories_of_the_city_well_545"), match: R("game.rule_18_0"), pressure: L("game.oh_my_dear_there_s_no_need_to_be_cross_with_me_546"), accuse: L("game.oh_dear_are_you_sure_look_carefully_at_your_notes_547") },
        guri: { prefix: [L("game.technically_speaking_548"), L("game.that_s_basic_stuff_549"), L("game.i_ve_got_a_method_okay_550")], key: [L("game.fine_here_s_a_free_consultation_551"), L("game.i_ll_give_you_some_insider_information_pay_attention_552"), L("game.only_because_you_seem_interested_553")], empty: [L("game.of_course_i_know_i_just_don_t_have_that_specific_infor_554"), L("game.didn_t_notice_it_was_a_strategic_decision_555"), L("game.i_d_have_seen_it_if_i_d_been_using_my_360_degree_obser_556")], greet: [L("game.hey_boss_want_an_expert_opinion_557"), L("game.dude_you_ve_got_to_see_my_market_vision_558"), L("game.ask_away_i_m_practically_an_expert_on_everything_559")], banter: [L("game.my_investment_method_is_foolproof_it_just_hasn_t_made__560"), L("game.property_appreciates_so_much_that_if_you_sell_now_you__561"), L("game.i_was_about_to_close_a_million_dollar_deal_turns_out_t_562")], topic: L("game.how_s_business_going_563"), match: R("game.rule_19_0"), pressure: L("game.easy_dude_i_was_getting_to_exactly_that_point_or_the_n_564"), accuse: L("game.that_s_legally_hold_on_let_me_organize_my_strategy_565") },
        leitor: { prefix: [L("game.yeah_well_566"), L("game.hmm_567"), L("game.put_this_on_record_568")], key: [L("game.write_it_down_before_they_outsource_that_too_569"), L("game.don_t_spread_it_around_570"), L("game.since_you_want_to_balance_this_account_571")], empty: [L("game.didn_t_see_my_information_balance_is_empty_572"), L("game.i_don_t_know_about_that_not_even_the_newspaper_helps_573"), L("game.couldn_t_tell_you_574")], greet: [L("game.read_the_paper_nothing_but_disasters_575"), L("game.if_you_re_selling_me_an_app_i_m_not_interested_576"), L("game.bah_what_a_night_577")], banter: [L("game.the_city_needs_jobs_not_another_presentation_announcin_578"), L("game.at_least_xavante_still_makes_me_suffer_for_a_cause_i_c_579"), L("game.funny_the_system_that_did_my_calculations_now_does_my__580"), L("game.i_open_the_newspaper_and_all_i_see_makes_me_want_to_cl_581")], topic: L("game.how_s_the_news_in_pelotas_582"), match: R("game.rule_20_0"), pressure: L("game.even_when_i_balanced_the_till_they_didn_t_demand_this__583"), accuse: L("game.bah_now_you_re_trying_to_charge_that_to_my_account_too_584") }
    };
    const pickR = arr => arr[Math.floor(Math.random() * arr.length)];
    const VICTIM_TIES = [L("game.just_on_greeting_terms_a_sad_business_585"), L("game.barely_knew_them_why_do_you_ask_586"), L("game.i_knew_them_we_had_some_unfinished_business_but_i_don__587"), L("game.knew_them_by_sight_they_came_by_every_now_and_then_588"), L("game.we_exchanged_a_few_words_now_and_then_nothing_more_589"), L("game.we_ran_into_each_other_but_weren_t_close_590"), L("game.we_had_a_silly_argument_nothing_serious_591"), L("game.yes_i_knew_them_a_reserved_person_not_very_talkative_592")];
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    function sentence(c, x, variant) {
        const where = NODES[c.node].locationPhrase, when = E.spanLabel(c.t0, c.t1);
        const formal = x === 'fiscal';
        const arr = c.kind === 'self' ? [`${L("game.i_595")}${formal ? L("game.was_596") : L("game.was_597")} ${where} ${when}`, `${L("game.i_stayed_601")}${where} ${when}`, `${when}${L("game.i_605")}${formal ? L("game.was_606") : L("game.was_607")} ${where}`] : [`${L("game.i_saw_610")}${nm(c.subject)} ${where} ${when}`, `${nm(c.subject)} ${formal ? L("game.was_616") : L("game.was_617")} ${where}, ${when}`, `${L("game.i_remember_621")}${nm(c.subject)} ${where} ${when}`];
        return arr[variant % arr.length];
    }
    function templateVoice(x, intent, d, variant) {
        const v = VOICES[x], i = Number.isInteger(variant) ? variant : Math.floor(Math.random() * (intent === 'banter' || intent === 'free' ? (v?.banter.length || 3) : 3)), choose = a => a[i % a.length];
        if (!v)
            return d.text || '...';
        const claims = d.claims || [];
        const facts = claims.length ? claims.map(c => sentence(c, x, i)).join('; ') + '.' : '';
        const gap = d.gap ? `${L("game.between_631")}${E.bLabel(d.gap[0])}${L("game.and_632")}${E.hhmm(E.blockTime(d.gap[1]) + 5)}${L("game.i_wandered_around_i_won_t_pin_down_the_location_633")}` : '';
        if (intent === 'free' && !d.selected) {
            return v.match.test(d.question || '') ? choose(v.banter) : choose(v.empty);
        }
        if (intent === 'banter')
            return choose(v.banter);
        if (intent === 'key')
            return choose(v.key) + (facts ? cap(facts) : choose(v.empty));
        if (['self', 'scene', 'other', 'saw', 'about', 'free'].includes(intent))
            return facts ? cap(choose(v.prefix) + facts) + gap : choose(v.empty) + gap;
        if (d.text)
            return intent === 'confront' ? d.text : choose(v.prefix) + d.text.replace(/^"|"$/g, '');
        return choose(v.empty);
    }
    const FORMS_OF_ADDRESS = { bento: { voc: 'Seu Bento', pr: L("game.you_648") }, fiscal: { voc: 'Fiscal', pr: L("game.you_650") }, tereza: { voc: 'Dona Tereza', pr: L("game.you_652") }, guri: { voc: 'Guri', pr: L("game.you_654") }, leitor: { voc: L("game.friend_655"), pr: L("game.you_656") } };
    const QV = {
        self: [(v, p, c) => `${v}${L("game.let_s_take_this_one_step_at_a_time_where_were_658")}${p}${L("game.between_659")}${c.a}${L("game.and_660")}${c.b}?`, (v, p, c) => `${L("game.i_need_the_sequence_not_an_impression_where_did_662")}${p}${L("game.go_from_663")}${c.a}${L("game.to_664")}${c.b}?`, (v, p, c) => `${L("game.only_what_you_remember_clearly_where_were_666")}${p}${L("game.between_667")}${c.a}${L("game.and_668")}${c.b}?`],
        scene: [(v, p, c) => `${language === "en" ? v : cap(p)}${L("game.see_anyone_671")}${c.locationPhrase}${L("game.around_672")}${c.h}${L("game.what_exactly_did_you_observe_673")}`, (v, p, c) => `${L("game.at_674")}${c.h}, ${c.locationPhrase}${L("game.who_did_676")}${p}${L("game.see_personally_677")}`, (v, p, c) => `${L("game.separate_what_you_saw_from_what_you_assumed_who_was_678")}${c.locationPhrase}${L("game.at_679")}${c.h}?`],
        other: [(v, p) => `${L("game.besides_that_who_else_did_681")}${p}${L("game.see_no_inferences_for_now_682")}`, (v, p) => `${L("game.and_before_or_after_anyone_else_683")}${p}${L("game.might_have_seen_684")}`, (v, p) => L("game.let_s_reconstruct_the_sequence_who_else_passed_by_685")],
        victim: [(v, p, c) => `${language === "en" ? v : cap(p)}${L("game.know_687")}${c.victim}${L("game.under_what_circumstances_688")}`, (v, p, c) => `${L("game.what_do_689")}${p}${L("game.know_firsthand_about_690")}${c.victim}?`, (v, p, c) => `${v}${L("game.how_did_you_know_693")}${c.victim}?`],
    };
    const LU_CHAT = [
        L("game.cl_udio_look_at_me_i_ve_known_you_for_years_one_thing__695"),
        L("game.what_if_these_blackouts_start_happening_worldwide_okay_696"),
        L("game.i_read_a_discussion_about_ai_controlling_decisions_it__697"),
        L("game.what_if_those_lights_in_the_sky_are_the_start_of_an_in_698"),
        L("game.sometimes_i_think_about_a_third_world_war_and_start_im_699"),
        L("game.you_ve_got_that_look_you_get_when_you_re_trying_to_sol_700"),
        L("game.christopher_seems_more_certain_of_the_way_than_either__701"),
        L("game.remember_how_many_times_we_discussed_a_hypothesis_unti_702"),
    ];
    const FLAVOR = {
        teatro: [L("game.the_doors_of_the_theatro_sete_de_abril_are_closed_a_po_703"), L("game.on_the_theatro_steps_cigarette_butts_and_a_wet_concert_704")],
        bnorte: [L("game.old_cigarette_butts_a_crumpled_theatro_sete_de_abril_t_705"), L("game.the_bench_is_damp_someone_scratched_z_l_into_the_wood_706")],
        leitorb: [L("game.newspaper_pages_stuck_to_the_bench_by_the_drizzle_707"), L("game.a_bookmark_with_the_livraria_do_globo_logo_708")],
        lixo: [L("game.coffee_cups_a_broken_umbrella_a_sour_smell_709"), L("game.pastry_wrappers_nothing_of_interest_710")],
        monu: [L("game.the_fountain_water_is_still_and_dark_coins_at_the_bott_711"), L("game.at_the_base_of_the_monument_moss_and_an_extinguished_c_712")],
        gurib: [L("game.yerba_mate_leaves_scattered_on_the_ground_a_cracked_ma_713"), L("game.a_wet_property_advertisement_with_an_almost_illegible__714")],
        farm: [L("game.farm_cia_central_closed_at_nine_the_green_cross_flicke_715"), L("game.in_the_window_a_poster_flu_vaccine_now_available_716")],
    };
    const FRAG_SPOT = { teatro: L("game.door_handle_717"), bnorte: L("game.bench_splinter_718"), leitorb: L("game.bench_splinter_719"), lixo: L("game.bin_railing_720"), monu: L("game.fountain_railing_721"), gurib: L("game.bench_corner_722"), farm: L("game.shop_window_grille_723") };
    const APPROACHES = ["neutral", "empathy", "respect", "precision", "recognition", "discretion", "pressure", "hostility"];
    const SOCIAL_PREF = { bento: ["respect", "discretion"], fiscal: ["precision", "respect"], tereza: ["empathy", "respect"], guri: ["recognition", "precision"], leitor: ["empathy", "respect"] };
    const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const clamp = n => Math.max(0, Math.min(100, n));
    function localApproach(q) { const z = norm(q); if (R("game.rule_86_0").test(z))
        return "hostility"; if (R("game.rule_86_1").test(z))
        return "pressure"; if (R("game.rule_86_2").test(z))
        return "discretion"; if (R("game.rule_86_3").test(z))
        return "recognition"; if (R("game.rule_86_4").test(z))
        return "empathy"; if (R("game.rule_86_5").test(z))
        return "precision"; if (R("game.rule_86_6").test(z))
        return "respect"; return "neutral"; }
    function asksInfo(q) { return R("game.rule_87_0").test(norm(q)); }
    function localIds(x, q, claims) { const z = norm(q); if (!asksInfo(q))
        return []; const names = NPCS.filter(n => n !== x && norm(nm(n)).split(' ').some(t => t.length > 3 && new RegExp('\\b' + t + '\\b').test(z))); const self = R("game.rule_88_0").test(z) && !names.length; const saw = R("game.rule_88_1").test(z); let cs = claims.filter(c => names.length ? names.includes(c.subject) && c.kind === 'saw' : self ? c.kind === 'self' : saw ? c.kind === 'saw' : false); const ts = [...String(q).matchAll(/\b(\d{1,2})\s*[:h]\s*(\d{2})\b/g)].map(m => `${m[1].padStart(2, '0')}:${m[2]}`); if (ts.length)
        cs = cs.filter(c => ts.some(t => t >= E.bLabel(c.t0) && t < E.hhmm(E.blockTime(c.t1) + 5))); return cs.slice(0, 3).map(c => c.id); }
    const REACTION_VOCAB = {
        [L("game.presence_and_observation_764")]: [L("game.saw_765"), L("game.seen_766"), L("game.observed_767"), L("game.spotted_768"), L("game.noticed_769"), L("game.was_at_770"), L("game.were_at_771"), L("game.was_there_772"), L("game.were_there_773"), L("game.visited_774"), L("game.went_to_775"), L("game.walked_by_776"), L("game.passed_by_777"), L("game.passed_778"), L("game.passed_through_779"), L("game.met_780"), L("game.encountered_781"), L("game.arrived_782"), L("game.arrived_at_783"), L("game.left_784"), L("game.left_785"), L("game.heard_786"), L("game.overheard_787"), L("game.witnessed_788"), L("game.testified_789"), L("game.lurking_790"), L("game.walked_around_791")],
        [L("game.crime_and_guilt_792")]: [L("game.killed_793"), L("game.kill_794"), L("game.killing_795"), L("game.murder_796"), L("game.guilt_797"), L("game.innocen_798"), 'crime', L("game.stole_800"), L("game.lied_801"), L("game.lie_802"), L("game.lying_803"), L("game.confess_804"), L("game.confession_805"), L("game.evidence_806"), L("game.proof_807"), L("game.prove_808"), L("game.proved_809"), L("game.proven_810"), L("game.alibi_811"), L("game.victim_812"), L("game.hid_813"), L("game.hidden_814"), L("game.concealed_815"), L("game.body_816"), L("game.corpse_817"), L("game.blood_818"), L("game.knife_819"), L("game.weapon_820"), L("game.death_821"), L("game.died_822"), L("game.dead_823"), L("game.deceased_824"), L("game.escaped_825"), L("game.fled_826"), L("game.responsible_for_827"), L("game.it_was_him_828"), L("game.it_was_her_829")],
        [L("game.clothes_footwear_and_traces_830")]: [L("game.footprint_831"), L("game.fiber_832"), L("game.trace_833"), L("game.fabric_834"), L("game.coat_835"), L("game.jacket_836"), L("game.shirt_837"), L("game.t_shirt_838"), L("game.pants_839"), L("game.clothing_840"), L("game.blouse_841"), L("game.hood_842"), L("game.boot_843"), L("game.boots_844"), L("game.shoe_845"), L("game.shoes_846"), L("game.sneakers_847"), L("game.flip_flop_848"), L("game.footwear_849"), L("game.red_850"), L("game.scarlet_851"), L("game.blue_852"), L("game.navy_853"), L("game.gray_854"), L("game.brown_855"), L("game.green_856"), L("game.olive_857"), L("game.black_858"), L("game.dark_colored_859"), L("game.white_860"), L("game.light_colored_861"), L("game.yellow_862"), L("game.beige_863")],
        [L("game.odors_864")]: [L("game.smell_865"), 'odor', L("game.stench_867"), L("game.tobacco_868"), L("game.smoke_869"), L("game.yerba_870"), L("game.chemical_871"), L("game.chemistry_872"), L("game.fish_873"), L("game.mud_874")],
        [L("game.locations_875")]: [L("game.scene_876"), L("game.monument_877"), L("game.fountain_878"), L("game.statue_879"), L("game.theater_880"), 'theatro', L("game.pharmacy_882"), L("game.bin_883"), L("game.bins_884"), L("game.north_bench_885"), L("game.square_886"), L("game.canal_887"), L("game.public_market_888"), L("game.steps_889"), L("game.shop_window_890"), L("game.library_891"), L("game.by_the_892"), L("game.at_the_893"), L("game.near_the_894"), L("game.nearby_895"), L("game.beside_the_896"), L("game.next_to_the_897"), L("game.in_front_of_the_898"), L("game.outside_the_899")],
        [L("game.time_900")]: [L("game.time_901"), L("game.hours_902"), L("game.half_an_hour_903"), L("game.minutes_904"), L("game.yesterday_905"), L("game.tomorrow_906"), L("game.today_907"), L("game.dawn_908"), L("game.midnight_909"), L("game.just_now_910"), L("game.fifteen_911"), L("game.twenty_912"), L("game.thirty_913"), L("game.forty_914"), L("game.fifty_915")],
        [L("game.system_916")]: ['prompt', 'json', L("game.language_model_919")]
    };
    const REACTION_BANNED = Object.values(REACTION_VOCAB).flat();
    const REACTION_RE = new RegExp('\\b(?:' + REACTION_BANNED.map(w => norm(w) + (w.endsWith('*') ? '\\w*' : '')).join('|') + ')\\b');
    const REACTION_OK = R("game.rule_104_0");
    const REACTION_AVOID = Object.entries(REACTION_VOCAB).map(([k, ws]) => k + ': ' + ws.map(w => w.replace('*', '…')).join(', ')).join('; ');
    const REACTION_META = R("game.rule_106_0");
    const nameTokens = list => list.flatMap(n => norm(n).split(' ')).filter(n => n.length > 2 && !['seu', 'dona', 'mate', 'do'].includes(n));
    function safeReaction(raw, x, scenario) {
        if (typeof raw !== 'string')
            return null;
        const t = raw.trim(), z = norm(t);
        if (t.length < 2 || t.length > 280 || /[{}<>\[\]\d\n\r]/.test(t) || !z)
            return null;
        if (REACTION_RE.test(z.replace(REACTION_OK, ' ')))
            return null;
        if (nameTokens([...NPCS.map(n => nm(n)), 'Lu', 'Cláudio', 'Christopher', scenario?.victim || '']).some(n => new RegExp('\\b' + n + '\\b').test(z)))
            return null;
        if (REACTION_META.test(z))
            return null;
        return t;
    }
    function safeEpilogue(raw, ctx = {}) {
        if (typeof raw !== 'string')
            return null;
        const t = raw.trim().replace(/\s+/g, ' '), z = norm(t);
        if (t.length < 2 || t.length > 280 || /[{}<>\[\]`]/.test(t) || !z)
            return null;
        if (R("game.rule_113_0").test(z))
            return null;
        if (nameTokens(NPCS.map(n => nm(n))).some(n => new RegExp('\\b' + n + '\\b').test(z)))
            return null;
        const FAIL = R("game.rule_116_0");
        const WIN = R("game.rule_117_0");
        if (ctx.win === true && FAIL.test(z))
            return null;
        if (ctx.win === false && WIN.test(z.replace(R("game.rule_119_0"), ' ')))
            return null;
        const DEATH = R("game.rule_120_0");
        const ev = norm(ctx.endVictim || ''), cv = nameTokens([ctx.caseVictim || '']);
        for (const part of t.split(/[.,;:!?—–]+/)) {
            const p = norm(part);
            if (!DEATH.test(p))
                continue;
            if (/\bchristopher\b/.test(p))
                return null;
            if (['lu', 'claudio'].some(who => new RegExp('\\b' + who + '\\b').test(p) && ev !== who))
                return null;
            if (!ev && !cv.some(n => new RegExp('\\b' + n + '\\b').test(p)))
                return null;
        }
        return t;
    }
    function parseSocial(raw, x, claims, scenario) { let z; try {
        z = JSON.parse(String(raw).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    }
    catch {
        return null;
    } if (!z || typeof z !== 'object' || Array.isArray(z) || Object.keys(z).some(k => !["speech", 'ids', "approach", "tactic", "target"].includes(k)) || !APPROACHES.includes(z.approach) || !Array.isArray(z.ids) || z.ids.length > 3 || new Set(z.ids).size !== z.ids.length || z.ids.some(id => typeof id !== 'string' || !claims.some(c => c.id === id)))
        return null; const speech = safeReaction(z.speech, x, scenario); if (z.tactic !== undefined && (!TACTICS.includes(z.tactic) || (z.tactic === "deflect" ? (!NPCS.includes(z.target) || z.target === x) : z.target != null)))
        return null; return speech ? { speech, ids: z.ids, approach: z.approach, ...(z.tactic !== undefined ? { tactic: z.tactic, target: z.target ?? null } : {}) } : null; }
    function canonicalDeposition(c, x) { return cap(sentence(c, x, 0)) + '.'; }
    class SocialEngine {
        constructor() { this.states = Object.fromEntries(NPCS.map(x => [x, { trust: 48, cooperation: 45, fear: 15, irritation: 10, positive: 0, seen: [], memory: [] }])); }
        context(x) { const s = this.states[x]; return { trust: s.trust, cooperation: s.cooperation, fear: s.fear, irritation: s.irritation, memory: s.memory.slice(-5).map(m => ({ question: m.q, answer: m.reply })) }; }
        remember(x, q, reply) { const s = this.states[x]; s.memory.push({ q: String(q).slice(0, 300), reply: String(reply).slice(0, 650) }); if (s.memory.length > 14)
            s.memory.shift(); }
        apply(x, q, approach, lit) { const s = this.states[x], k = norm(q); s.fear = clamp(15 + (4 - lit) * 17); if (!k || s.seen.includes(k))
            return false; s.seen.push(k); if (s.seen.length > 60)
            s.seen.shift(); const local = localApproach(q); if (["hostility", "pressure"].includes(local))
            approach = local; const likes = SOCIAL_PREF[x].includes(approach); if (approach === "hostility") {
            s.trust = clamp(s.trust - 12);
            s.cooperation = clamp(s.cooperation - 10);
            s.irritation = clamp(s.irritation + 15);
        }
        else if (approach === "pressure") {
            s.trust = clamp(s.trust - 7);
            s.cooperation = clamp(s.cooperation - 5);
            s.irritation = clamp(s.irritation + 9);
        }
        else if (likes) {
            s.trust = clamp(s.trust + 12);
            s.cooperation = clamp(s.cooperation + 13);
            s.irritation = clamp(s.irritation - 7);
            s.positive++;
        }
        else if (approach !== "neutral") {
            s.trust = clamp(s.trust + 4);
            s.cooperation = clamp(s.cooperation + 5);
            s.irritation = clamp(s.irritation - 2);
        } return likes; }
        ready(x) { const s = this.states[x]; return s.positive >= 2 && s.trust >= 70 && s.cooperation >= 65 && s.irritation < 45; }
        mood(x) { const s = this.states[x]; return s.irritation >= 35 ? L("game.seems_irritated_979") : s.trust >= 70 ? L("game.seems_more_comfortable_with_you_980") : s.positive ? L("game.the_conversation_seems_to_be_going_better_981") : ''; }
    }
    const TACTICS = ["cooperate", "reassure", "reserve", "deflect", "challenge"];
    function temperament(x, role, rng) { const base = ['guri', 'bento'].includes(x) ? 24 : 32, draw = () => base + rng.int(0, 12); const first = draw(), second = draw(); const deflectAt = role === "killer" ? Math.min(first, second) : first; return { deflectAt, reserveAt: 16 + rng.int(0, 10), guarded: rng.chance(role === "informant" ? 0.6 : 0.3) }; }
    const TACTIC_LABEL = { cooperate: L("game.cooperate_992"), reassure: L("game.reduce_tension_993"), reserve: L("game.be_cautious_994"), deflect: L("game.shift_the_focus_995"), challenge: L("game.challenge_the_approach_996") };
    const RELATIONS = ["bond", "tension", "neutral"];
    const PRIVATE_GOALS = { killer: L("game.avoid_being_discovered_maintain_only_the_authorized_al_1000"), informant: L("game.protect_your_privacy_and_negotiate_cooperation_do_not__1001"), neutral: L("game.avoid_trouble_and_cooperate_according_to_your_personal_1002") };
    const OPINION_WORDS = R("game.rule_147_0");
    function namedTargets(q, x) { const z = norm(q); return NPCS.filter(n => n !== x && norm(nm(n)).split(' ').some(t => t.length > 3 && new RegExp('\\b' + t + '\\b').test(z))); }
    class StrategyEngine {
        constructor(w) { const tr = E.RNG((w.seed ^ 0x6a09e667) >>> 0); this.actors = Object.fromEntries(NPCS.map(x => [x, { ...temperament(x, w.role[x], tr), goal: PRIVATE_GOALS[w.role[x]], pressure: 0, attention: 0, tactic: "cooperate", target: null, relations: Object.fromEntries(NPCS.filter(n => n !== x).map(n => [n, 40])), suspicions: Object.fromEntries(NPCS.filter(n => n !== x).map(n => [n, 10])), known: new Set(w.testimony[x].saw.map(c => c.subject).filter(n => n !== x)), events: [], turns: new Set(), plans: 0 }])); this.lastTick = -1; this.pairTicks = {}; this.own = Object.fromEntries(NPCS.map(x => [x, [...w.testimony[x].self, ...w.testimony[x].saw].map(c => ({ kind: c.kind, speaker: c.speaker, subject: c.subject, node: c.node, t0: c.t0, t1: c.t1, k: c.k }))])); }
        event(x, kind, detail = '', n = null) { const s = this.actors[x]; if (!s)
            return; if (n && n !== x && NPCS.includes(n))
            s.known.add(n); s.events.push({ type: kind, detail: String(detail).slice(0, 160) }); if (s.events.length > 10)
            s.events.shift(); const delta = { question: 2, interrogation: 8, pressure: 13, contradiction: 20, blackout: 7, accusation: 12, observation: 4, conversation: -2 }[kind] || 0; s.pressure = clamp(s.pressure + delta); if (["question", "interrogation", "pressure", "contradiction", "observation"].includes(kind))
            s.attention = clamp(s.attention + Math.max(1, delta)); }
        hear(x, c) { const s = this.actors[x]; if (!s || !c || c.k !== 'claim' || !NPCS.includes(c.speaker))
            return; if (c.speaker !== x)
            s.known.add(c.speaker); if (c.subject !== x && NPCS.includes(c.subject))
            s.known.add(c.subject); if (c.speaker !== x && this.own[x].some(k => E.contradicts(k, c))) {
            s.suspicions[c.speaker] = clamp(s.suspicions[c.speaker] + 18);
            s.relations[c.speaker] = clamp(s.relations[c.speaker] - 8);
        } this.event(x, "statement", L("game.i_heard_a_statement_from_1015") + nm(c.speaker), c.speaker); }
        context(x, q = '') { const s = this.actors[x]; const targets = [...new Set([...s.known, ...namedTargets(q, x)])].filter(n => NPCS.includes(n) && n !== x); return { goal: s.goal, pressure: s.pressure, attention: s.attention, lastTactic: s.tactic, events: s.events.slice(-5), targets: targets.map(n => ({ id: n, name: nm(n), affinity: s.relations[n], suspicion: s.suspicions[n] })), tactics: TACTICS.slice() }; }
        fallback(x, q, lit) { const s = this.actors[x], ctx = this.context(x, q), target = ctx.targets.slice().sort((a, b) => b.suspicion - a.suspicion || a.affinity - b.affinity)[0]?.id || null; const hostile = ["pressure", "hostility"].includes(localApproach(q)); const high = s.pressure >= s.deflectAt || hostile; let tactic = "cooperate"; if (high) {
            const suspicious = target && s.suspicions[target] >= 26;
            const deflect = target && (suspicious || s.pressure >= s.deflectAt);
            tactic = deflect ? "deflect" : s.pressure >= 55 ? "reserve" : "challenge";
        }
        else if (lit < 3)
            tactic = "reassure";
        else if (s.guarded && s.pressure >= s.reserveAt)
            tactic = "reserve"; return { tactic: tactic, target: tactic === "deflect" ? target : null }; }
        commit(x, q, proposal, lit) { const s = this.actors[x], fb = this.fallback(x, q, lit), ctx = this.context(x, q), valid = proposal && TACTICS.includes(proposal.tactic) && ((proposal.tactic === "deflect" && ctx.targets.some(a => a.id === proposal.target)) || (proposal.tactic !== "deflect" && proposal.target == null)); const p = valid ? { tactic: proposal.tactic, target: proposal.target ?? null } : fb; const key = norm(q); if (key && s.turns.has(key))
            return { tactic: s.tactic, target: s.target, fresh: false }; if (key)
            s.turns.add(key); if (s.turns.size > 80)
            s.turns.delete(s.turns.values().next().value); s.tactic = p.tactic; s.target = p.target; s.plans++; if (p.target)
            s.known.add(p.target); return { ...p, fresh: true }; }
        exchange(pair, relation, claim) { const [a, b] = pair; if (!this.actors[a] || !this.actors[b] || a === b)
            return; const d = relation === "bond" ? 9 : relation === "tension" ? -10 : 1; for (const [x, y] of [[a, b], [b, a]]) {
            const s = this.actors[x];
            s.relations[y] = clamp(s.relations[y] + d);
            s.suspicions[y] = clamp(s.suspicions[y] + (d < 0 ? 5 : d > 1 ? -3 : 0));
            this.event(x, "conversation", L("game.conversation_with_1031") + nm(y), y);
        } if (claim && pair.includes(claim.speaker))
            this.hear(pair.find(x => x !== claim.speaker), claim); }
        tick(min, ent, lit, refusing) { const slot = Math.floor(min / 5); if (slot <= this.lastTick)
            return; this.lastTick = slot; for (const x of NPCS) {
            const s = this.actors[x];
            if (refusing[x])
                continue;
            if (slot) {
                s.pressure = clamp(s.pressure - 2);
                const p = this.fallback(x, '', lit);
                s.tactic = p.tactic;
                s.target = p.target;
            }
        } if (!slot)
            return; for (let i = 0; i < NPCS.length; i++)
            for (let j = i + 1; j < NPCS.length; j++) {
                const a = NPCS[i], b = NPCS[j], key = a + ':' + b;
                if (refusing[a] || refusing[b] || !ent[a] || !ent[b] || Math.max(Math.abs(ent[a].x - ent[b].x), Math.abs(ent[a].y - ent[b].y)) > 4 || slot - (this.pairTicks[key] ?? -99) < 2)
                    continue;
                this.pairTicks[key] = slot;
                const sa = this.actors[a], sb = this.actors[b];
                const tense = sa.relations[b] < 35 || sb.relations[a] < 35 || sa.pressure + sb.pressure > 90 || ['fiscal:guri', 'fiscal:leitor'].includes(key);
                this.exchange([a, b], tense ? "tension" : "bond", null);
            } }
        opinion(x, n) { const s = this.actors[x]; if (!NPCS.includes(n) || x === n)
            return ''; const known = s.known.has(n); if (!known)
            return `${L("game.about_1039")}${nm(n)}${L("game.i_don_t_know_them_well_enough_to_form_an_opinion_1040")}`; const a = s.relations[n], u = s.suspicions[n]; const view = u >= 26 ? L("game.i_have_reservations_i_d_like_to_understand_what_they_s_1041") : a >= 48 ? L("game.conversation_is_usually_easy_1042") : a <= 30 ? L("game.we_don_t_get_along_very_well_1043") : L("game.i_don_t_quite_know_what_to_think_yet_1044"); return `${nm(n)}: ${view}${L("game.it_s_just_my_impression_not_proof_1047")}`; }
    }
    function tacticReaction(x, p) { const table = { bento: { reassure: L("game.son_let_s_take_it_easy_1048"), reserve: L("game.i_d_rather_speak_only_about_what_i_m_certain_of_1049"), challenge: L("game.let_s_not_jump_to_conclusions_1050") }, fiscal: { reassure: L("game.let_s_stay_objective_1051"), reserve: L("game.don_t_extrapolate_beyond_the_information_given_1052"), challenge: L("game.your_interpretation_requires_justification_1053") }, tereza: { reassure: L("game.my_dear_there_s_no_need_to_rush_1054"), reserve: L("game.dear_be_careful_with_conclusions_1055"), challenge: L("game.my_dear_aren_t_you_getting_ahead_of_yourself_1056") }, guri: { reassure: L("game.relax_boss_crisis_management_is_my_specialty_1057"), reserve: L("game.my_methodology_requires_caution_okay_1058"), challenge: L("game.that_s_a_very_basic_interpretation_1059") }, leitor: { reassure: L("game.bah_let_s_balance_one_account_at_a_time_1060"), reserve: L("game.i_d_rather_not_take_any_more_losses_1061"), challenge: L("game.that_account_hasn_t_balanced_yet_1062") } }; return table[x]?.[p.tactic] || ''; }
    const AMBIENT_TOPICS = { bento: L("game.routines_discretion_and_cold_weather_1064"), fiscal: L("game.order_precision_and_public_services_1065"), tereza: L("game.memories_and_caring_for_people_1066"), guri: L("game.business_prestige_and_self_confidence_1067"), leitor: L("game.economy_automation_and_football_1068") };
    const AMBIENT_LOCAL = { bento: [L("game.son_best_not_to_look_for_trouble_1069"), L("game.a_little_calm_never_hurt_anyone_1070")], fiscal: [L("game.the_lack_of_planning_is_evident_1071"), L("game.one_must_distinguish_opinion_from_information_1072")], tereza: [L("game.my_dear_a_good_conversation_is_worth_a_lot_1073"), L("game.some_things_only_time_can_teach_1074")], guri: [L("game.that_s_a_strategic_opportunity_dude_1075"), L("game.i_d_solve_it_with_my_exclusive_method_1076")], leitor: [L("game.always_the_same_balance_sheet_losses_1077"), L("game.bah_even_hope_is_on_clearance_1078")] };
    const PAIR_TALK = {
        'bento:fiscal': [L("game.son_nobody_likes_being_told_off_1080"), L("game.a_well_founded_warning_is_not_a_scolding_1081")],
        'bento:tereza': [L("game.we_need_to_preserve_a_little_peace_and_quiet_1083"), L("game.my_dear_too_much_quiet_can_become_loneliness_1084")],
        'bento:guri': [L("game.son_don_t_promise_what_you_can_t_deliver_1086"), L("game.that_s_just_an_optimistic_projection_of_results_1087")],
        'bento:leitor': [L("game.honest_work_demands_enough_of_us_already_1089"), L("game.and_they_still_manage_to_cut_our_jobs_1090")],
        'fiscal:tereza': [L("game.there_must_be_rules_for_things_to_work_1092"), L("game.my_dear_we_also_need_to_know_how_to_listen_1093")],
        'fiscal:guri': [L("game.your_projection_lacks_justification_1095"), L("game.you_just_haven_t_understood_the_premium_methodology_1096")],
        'fiscal:leitor': [L("game.without_revenue_there_are_no_decent_services_1098"), L("game.with_revenue_i_haven_t_seen_much_either_1099")],
        'tereza:guri': [L("game.my_dear_don_t_be_so_impressed_with_yourself_1101"), L("game.but_self_esteem_is_a_high_performance_asset_1102")],
        'tereza:leitor': [L("game.dear_ease_up_on_the_pessimism_1104"), L("game.only_when_my_team_gives_me_something_to_celebrate_1105")],
        'guri:leitor': [L("game.my_method_will_revolutionize_the_market_dude_1107"), L("game.heard_that_before_result_unemployment_1108")]
    };
    function publicSnapshot(c) { const out = { n: c.n, k: c.k }; for (const k of ['speaker', 'subject', 'kind', 'node', 't0', 't1', 'x', 'shoe', 'color', 'smell', "contact", 'name', 'text'])
        if (c[k] !== undefined)
            out[k] = c[k]; return out; }
    function publicLabel(c) { switch (c.k) {
        case 'claim': return `${nm(c.speaker)} ${c.kind === 'self' ? L("game.claims_to_have_been_1126") : L("game.claims_to_have_seen_1127") + nm(c.subject)} ${NODES[c.node].locationPhrase} ${E.spanShort(c.t0, c.t1)}`;
        case 'vis': return `${nm(c.x)}: ${c.shoe}${L("game.clothing_1134")}${c.color}`;
        case 'peg': return `${L("game.footprint_1137")}${c.shoe}`;
        case 'frg': return `${L("game.fiber_1140")}${c.color}`;
        case 'odr': return `${L("game.odor_at_the_scene_1143")}${c.smell}`;
        case 'snf': return `${L("game.christopher_and_1146")}${nm(c.x)}${L("game.odor_1147")}${c.smell}; ${c.contact ? L("game.reacted_1149") : L("game.did_not_react_1150")}`;
        case 'obj': return c.name;
        case "note": return c.text;
        default: return L("game.note_1154");
    } }
    function luPlans(cards) {
        const out = [], add = (text, refs = [], target = null) => out.push({ id: 'p' + out.length, text, refs, target });
        const cs = cards.filter(c => c.k === 'claim');
        for (let i = 0; i < cs.length; i++)
            for (let j = i + 1; j < cs.length; j++) {
                const a = cs[i], b = cs[j];
                if (a.speaker !== b.speaker && E.contradicts(a, b)) {
                    add(`${L("game.statements_1157")}${a.n}${L("game.and_1158")}${b.n}${L("game.are_incompatible_confirm_the_sequence_with_1159")}${nm(a.speaker)}${L("game.and_1160")}${nm(b.speaker)}${L("game.we_don_t_yet_know_which_is_wrong_1161")}`, [a.n, b.n], a.speaker);
                }
            }
        for (const e of cards.filter(c => ['peg', 'frg', 'odr', 'snf'].includes(c.k))) {
            for (const v of cards.filter(c => c.k === 'vis' || c.k === 'snf')) {
                let match = e.k === 'peg' && v.k === 'vis' && v.shoe === e.shoe || e.k === 'frg' && v.k === 'vis' && v.color === e.color || e.k === 'odr' && v.k === 'snf' && v.smell === e.smell;
                if (match)
                    add(`${L("game.note_1174")}${e.n}${L("game.is_compatible_with_1175")}${v.n}${L("game.from_1176")}${nm(v.x)}${L("game.it_s_a_hypothesis_to_test_not_proof_of_guilt_look_for__1177")}`, [e.n, v.n], v.x);
            }
            if (e.k === 'snf' && e.contact)
                add(`${L("game.christopher_s_reaction_in_1179")}${e.n}${L("game.suggests_contact_with_the_scene_not_necessarily_involv_1180")}${nm(e.x)}${L("game.about_their_movements_1181")}`, [e.n], e.x);
        }
        for (const c of cs)
            add(`${L("game.it_s_worth_checking_statement_1182")}${c.n}${L("game.find_someone_else_who_can_confirm_or_contradict_the_mo_1183")}${nm(c.subject)}.`, [c.n], c.subject);
        add(L("game.separate_what_was_observed_from_what_was_inferred_coll_1185"));
        return [...out.slice(0, 24), out[out.length - 1]].filter((p, i, a) => a.findIndex(q => q.id === p.id) === i);
    }
    function parseLu(raw, plans, scenario) { let z; try {
        z = JSON.parse(String(raw).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    }
    catch {
        return null;
    } if (!z || typeof z !== 'object' || Array.isArray(z) || Object.keys(z).some(k => !["speech", "plans"].includes(k)) || !Array.isArray(z.plans) || z.plans.length > 2 || new Set(z.plans).size !== z.plans.length || z.plans.some(id => !plans.some(p => p.id === id)))
        return null; const speech = safeReaction(z.speech, 'lu', scenario); return speech ? { speech, plans: z.plans } : null; }
    function parseAmbient(raw, pair, claims, scenario) { let z; try {
        z = JSON.parse(String(raw).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
    }
    catch {
        return null;
    } if (!z || typeof z !== 'object' || Array.isArray(z) || Object.keys(z).some(k => !["lines", 'id', "relationship"].includes(k)) || !Array.isArray(z.lines) || z.lines.length !== 2 || !(z.id === null || claims.some(c => c.id === z.id)))
        return null; const lines = z.lines.map((t, i) => safeReaction(t, pair[i], scenario)); return lines.every(Boolean) && (z.relationship === undefined || RELATIONS.includes(z.relationship)) ? { lines, id: z.id, relationship: z.relationship || "neutral" } : null; }
    class Game {
        constructor(ui) { this.ui = ui; this.voice = null; }
        start(seed, mode = 'mvp', excludeCase = null, requiredCase = null, scenario = null) {
            const opts = { mode, excludeCase, requiredCase, scenario, verify: (w, board, sol) => verifyPlayable(w, board, sol) };
            let w = E.generateValid(seed, opts);
            if (!w)
                throw new Error(L("game.could_not_generate_a_game_with_a_verified_route_try_an_1200"));
            return this.initWorld(w, mode);
        }
        initWorld(w, mode = w.mode) {
            this.w = w;
            this.mode = mode;
            this.busy = false;
            this.qt = {};
            this.rng = E.RNG((w.seed ^ 0x99a1) >>> 0);
            this.min = 0;
            this.over = false;
            this.p = { x: E.START.x, y: E.START.y };
            this.dog = { x: E.START.x - 1, y: E.START.y };
            this.hp = 100;
            this.san = 78;
            this.en = 64;
            this.monster = 2;
            this.cig = 7;
            this.monsterUntil = -1;
            this.emberUntil = -1;
            this.cards = [];
            this.ncard = 0;
            this.asked = {};
            this.keyGot = {};
            this.sniffed = {};
            this.seen = {};
            this.examined = {};
            this.luShown = {};
            this.found = { obj: false, peg: false, frg: false, odr: false };
            this.dark = {};
            this.rainOn = false;
            this.lu = { trust: 60, story: 0, lastChat: -99, away: false };
            this.board = { locked: false, suspect: null, sel: null };
            this.fled = {};
            this.fleeCount = 0;
            this.confronted = {};
            this.hinted = {};
            this.lastNode = null;
            this.stats = { boardFails: 0, wrongAccusations: 0 };
            this.dealt = {};
            this.secretGot = {};
            this.tie = Object.fromEntries(NPCS.map((x, i, all) => [x, null]));
            {
                const ties = E.RNG((w.seed ^ 0x2545f491) >>> 0).shuffle(VICTIM_TIES);
                NPCS.forEach((x, i) => this.tie[x] = ties[i]);
            }
            this.refusing = {};
            this.dialogRevision = 0;
            this.finalAccused = null;
            this.social = new SocialEngine();
            this.strategy = new StrategyEngine(w);
            this.lu.shared = [];
            this.lu.memory = [];
            this.ambientSeen = new Set();
            this.ambientHeard = new Set();
            this.ambientLast = -99;
            this.socialWorld = false;
            this.ent = {};
            const occ = new Set([this.k(this.p), this.k(this.dog)]);
            for (const x of NPCS)
                this.ent[x] = this.placeIn(w.now[x], occ);
            this.ent.lu = this.placeIn(w.luNode, occ);
            this.npcNode = Object.assign({}, w.now, { lu: w.luNode });
            return w;
        }
        k(p) { return p.x + ',' + p.y; }
        placeIn(node, occ) {
            const [x0, y0, x1, y1] = NODES[node].zone, [cx, cy] = NODES[node].c;
            const cells = [];
            for (let y = y0; y <= y1; y++)
                for (let x = x0; x <= x1; x++)
                    if (E.walkable(x, y) && !occ.has(x + ',' + y))
                        cells.push({ x, y, d: Math.abs(x - cx) + Math.abs(y - cy) + this.rng.f() * 3 });
            cells.sort((a, b) => a.d - b.d);
            const c = cells[0] || { x: cx, y: cy };
            occ.add(c.x + ',' + c.y);
            return { x: c.x, y: c.y };
        }
        occupied(exceptDog) {
            const s = new Set(Object.values(this.ent).map(p => this.k(p)));
            if (!exceptDog)
                s.add(this.k(this.dog));
            return s;
        }
        get clock() { return E.nowLabel(this.min); }
        quadAt(p) { return MAP.Q[p.y][p.x]; }
        isDark(q) { return !!this.dark[q]; }
        litCount() { return QUADS.filter(q => !this.dark[q]).length; }
        advance(m) {
            if (this.over)
                return;
            const steps = Math.max(1, Math.round(m * 4));
            for (let i = 0; i < steps && !this.over; i++) {
                const dt = m / steps;
                this.min += dt;
                if (this.isDark(this.quadAt(this.p)))
                    this.san -= 0.8 * dt;
                if (!this.rainOn && this.min >= this.w.rain) {
                    this.rainOn = true;
                    this.ui.log(L("game.the_drizzle_grows_heavier_the_sidewalks_turn_to_mirror_1204"), 'dim');
                }
                for (const q of QUADS)
                    if (!this.dark[q] && this.min >= this.w.blackout[q])
                        this.blackout(q);
                this.checkDeath();
            }
            if (this.socialWorld && !this.over)
                this.strategy.tick(this.min, this.ent, this.litCount(), this.refusing);
            this.ui.update();
        }
        blackout(q) {
            this.dark[q] = true;
            for (const x of NPCS)
                this.strategy.event(x, "blackout", L("game.another_sector_has_lost_its_lights_1207"));
            this.ui.log(`${L("game.the_streetlights_in_the_1208")}${QUAD_NAMES[q]}${L("game.sector_flicker_and_go_out_1209")}`, 'warn');
            const occ = this.occupied(true);
            occ.add(this.k(this.p));
            for (const x of [...NPCS, 'lu']) {
                if (NODES[this.npcNode[x]].q !== q)
                    continue;
                const opts = NODE_IDS.filter(n => n !== this.npcNode[x]);
                const dest = this.rng.f() < 0.6 ? this.rng.pick(opts) : this.npcNode[x];
                occ.delete(this.k(this.ent[x]));
                this.ent[x] = this.placeIn(dest, occ);
                this.npcNode[x] = dest;
            }
            if (this.litCount() === 0)
                this.lose("blackout");
        }
        accelerate() {
            const pend = QUADS.filter(q => !this.dark[q]).sort((a, b) => this.w.blackout[a] - this.w.blackout[b]);
            if (pend.length) {
                this.w.blackout[pend[0]] = this.min;
                this.blackout(pend[0]);
            }
        }
        checkDeath() {
            if (this.over)
                return;
            this.san = Math.min(100, this.san);
            this.hp = Math.min(100, this.hp);
            this.en = Math.max(0, Math.min(100, this.en));
            if (this.san <= 0) {
                this.san = 0;
                this.lose("sanity");
            }
            else if (this.hp <= 0) {
                this.hp = 0;
                this.lose("health");
            }
        }
        stepCost() { let s = E.STEP_SEC / 60; if (this.min < this.monsterUntil)
            s *= 0.6; if (this.en <= 0)
            s *= 2; return s; }
        visible(x) {
            const p = this.ent[x];
            if (!p)
                return false;
            if (this.fled[x])
                return Math.max(Math.abs(p.x - this.p.x), Math.abs(p.y - this.p.y)) <= 1;
            return !this.isDark(this.quadAt(p)) || Math.max(Math.abs(p.x - this.p.x), Math.abs(p.y - this.p.y)) <= 2;
        }
        adjacentAll() {
            return [...NPCS, 'lu'].filter(x => { const p = this.ent[x]; return this.visible(x) && Math.max(Math.abs(p.x - this.p.x), Math.abs(p.y - this.p.y)) <= 1; });
        }
        adjacent() { return this.adjacentAll()[0] || null; }
        get node() { return E.nodeAt(this.p.x, this.p.y); }
        move(dx, dy) {
            if (this.over || this.busy)
                return;
            const nx = this.p.x + dx, ny = this.p.y + dy;
            if (!E.walkable(nx, ny))
                return;
            if (this.occupied(true).has(nx + ',' + ny))
                return;
            const prev = { x: this.p.x, y: this.p.y };
            this.p = { x: nx, y: ny };
            this.dog = (this.dog.x === nx && this.dog.y === ny) ? prev : prev;
            const n = this.node;
            if (n && n !== this.lastNode) {
                const dark = this.isDark(NODES[n].q);
                this.ui.log(`${NODES[n].name}${dark ? L("game.in_darkness_1219") : ''}.`, 'dim');
                if ((n === this.w.S && !this.found.odr) || (n === this.w.fragNode && !this.found.frg)) {
                    if (!this.hinted[n]) {
                        this.hinted[n] = true;
                        this.ui.log(L("game.christopher_plants_his_paws_perks_up_his_ears_and_insi_1223"), 'hint');
                    }
                }
            }
            this.lastNode = n;
            this.advance(this.stepCost());
            this.checkAmbient();
        }
        nearbyPair() { const dist = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); for (let i = 0; i < NPCS.length; i++)
            for (let j = i + 1; j < NPCS.length; j++) {
                const a = NPCS[i], b = NPCS[j], key = a + ':' + b;
                if (this.ambientHeard.has(key) || this.refusing[a] || this.refusing[b] || !this.visible(a) || !this.visible(b))
                    continue;
                if (dist(this.ent[a], this.ent[b]) <= 4 && dist(this.p, this.ent[a]) <= 4 && dist(this.p, this.ent[b]) <= 4)
                    return { pair: [a, b], key };
            } return null; }
        checkAmbient() { if (!this.socialWorld || this.over || this.busy)
            return; const e = this.nearbyPair(); if (!e || this.ambientSeen.has(e.key) || this.min - this.ambientLast < 3)
            return; this.ambientSeen.add(e.key); this.ambientLast = this.min; const [a, b] = e.pair; this.ui.log(`💬 ${nm(a)}${L("game.and_1227")}${nm(b)}${L("game.are_talking_quietly_1228")}${nm(a)}: “${AMBIENT_LOCAL[a][0]}${L("game.use_listen_to_follow_the_conversation_1230")}`, 'hint'); this.ui.update(); }
        idle() { this.checkAmbient(); }
        async listenAmbient() {
            if (this.over || this.busy)
                return;
            const e = this.nearbyPair();
            if (!e)
                return;
            const pair = e.pair;
            this.ambientHeard.add(e.key);
            const claims = pair.flatMap(x => this.w.testimony[x].saw).filter(c => !this.cards.some(k => k.id === c.id));
            const fb = { lines: PAIR_TALK[e.key] || pair.map((x, i) => AMBIENT_LOCAL[x][(this.ambientHeard.size + i) % 2]), id: claims[0]?.id || null, relationship: this.strategy.actors[pair[0]].relations[pair[1]] < 35 || e.key === 'fiscal:guri' || e.key === 'fiscal:leitor' ? "tension" : "bond" };
            this.advance(1);
            if (this.over)
                return;
            const rev = ++this.dialogRevision;
            this.busy = true;
            this.ui.dialog({ who: null, text: null, options: [], freePending: true });
            const result = this.voice ? await Promise.race([Promise.resolve().then(() => this.voice(null, 'ambient', { pair, claims, lit: this.litCount(), relations: pair.map(x => ({ id: x, affinity: this.strategy.actors[x].relations[pair.find(y => y !== x)], suspicion: this.strategy.actors[x].suspicions[pair.find(y => y !== x)], pressure: this.strategy.actors[x].pressure })) }, fb)).catch(() => fb), new Promise(resolve => { this.skipFree = () => resolve(fb); })]) : fb;
            if (this.over || rev !== this.dialogRevision)
                return;
            this.busy = false;
            this.skipFree = null;
            const r = result && Array.isArray(result.lines) && result.lines.length === 2 ? result : fb;
            const c = claims.find(c => c.id === r.id);
            let text = pair.map((x, i) => `${nm(x)}: ${r.lines[i]}`).join('\n\n');
            if (c) {
                this.addCard(c, nm(c.speaker) + L("game.overheard_conversation_1241"));
                text += L("game.overheard_statement_1242") + nm(c.speaker) + ': ' + canonicalDeposition(c, c.speaker);
            }
            this.strategy.exchange(pair, RELATIONS.includes(r.relationship) ? r.relationship : fb.relationship, c);
            for (const x of pair) {
                const other = pair.find(y => y !== x);
                this.social.remember(x, L("game.conversation_with_1244") + nm(other), text);
            }
            this.ui.log(text, 'npc');
            this.ui.dialog({ who: null, text, options: [{ label: L("game.return_to_the_square_1246"), fn: () => this.ui.closeDialog() }, ...pair.filter(x => this.adjacentAll().includes(x)).map(x => ({ label: L("game.talk_to_1247") + nm(x), fn: () => this.talk(x) }))] });
            this.ui.update();
        }
        addCard(c, src) {
            const sig = c.k === 'claim' ? c.id : c.k + ':' + (c.x || '') + (c.shoe || '') + (c.color || '') + (c.smell || '') + (c.text || '');
            if (this.cards.find(o => o.sig === sig))
                return null;
            const card = Object.assign({}, c, { sig, n: ++this.ncard, src: src || '', at: this.clock });
            this.cards.push(card);
            return card;
        }
        hallucinate(speaker) {
            if (this.san >= 35 || Math.random() > 0.4)
                return;
            const others = NPCS.filter(n => n !== speaker);
            const b = this.w.w0 + Math.floor(Math.random() * (this.w.w1 - this.w.w0 + 1));
            const c = { k: 'claim', id: 'h' + this.ncard, kind: 'saw', speaker, subject: others[Math.floor(Math.random() * others.length)],
                node: NODE_IDS[Math.floor(Math.random() * NODE_IDS.length)], t0: b, t1: b, fake: true };
            this.addCard(c, nm(speaker));
        }
        get real() { return this.cards.filter(c => !c.fake); }
        has(k) { return this.real.some(c => c.k === k); }
        async speak(x, intent, d) {
            const fb = templateVoice(x, intent, d);
            return fb;
        }
        knownBy(x) {
            const t = this.w.testimony[x];
            return { claims: [...t.self, ...t.saw, ...(this.keyGot[x] && t.key ? [t.key] : [])], gap: t.gap };
        }
        act() {
            if (this.over || this.busy)
                return;
            const all = this.adjacentAll();
            const heard = this.socialWorld && this.nearbyPair();
            if (heard || all.length > 1 || (all.length && this.node))
                return this.ui.dialog({ who: null, text: L("game.what_to_do_1259"), options: [
                        ...(heard ? [{ label: L("game.listen_to_1260") + heard.pair.map(nm).join(L("game.and_1261")) + ' (1 min)', fn: () => this.listenAmbient(), hot: true }] : []),
                        ...all.map(x => ({ label: nm(x), fn: () => x === 'lu' ? this.talkLu() : this.talk(x) })),
                        ...(this.node ? [{ label: L("game.examine_1264") + NODES[this.node].shortName, fn: () => { this.ui.closeDialog(); this.examine(this.node); } }] : []),
                        { label: L("game.leave_1265"), fn: () => this.ui.closeDialog() }
                    ] });
            const x = all[0];
            if (x === 'lu')
                return this.talkLu();
            if (x)
                return this.talk(x);
            if (this.node)
                return this.examine(this.node);
            this.ui.log(L("game.there_s_nothing_to_examine_here_1267"), 'dim');
        }
        examine(n) {
            const w = this.w, dark = this.isDark(NODES[n].q);
            if (dark) {
                this.advance(1);
                this.san -= 2;
                this.ui.log(L("game.too_dark_to_see_anything_your_heart_races_1269"), 'warn');
                return this.ui.update();
            }
            this.advance(2);
            if (this.over || this.isDark(NODES[n].q))
                return;
            let got = false;
            if (n === w.S) {
                if (!this.found.obj) {
                    this.found.obj = true;
                    got = true;
                    this.addCard({ k: 'obj', name: w.object, node: n }, L("game.scene_1272"));
                    this.ui.log(`${L("game.hidden_1273")}${NODES[n].locationPhrase}: ${w.object}.`, 'clue');
                    this.san -= 4;
                }
                if (!this.found.peg) {
                    if (this.min < w.rain) {
                        this.found.peg = true;
                        got = true;
                        this.addCard({ k: 'peg', shoe: w.shoe[w.A], node: n }, L("game.scene_1278"));
                        this.ui.log(`${L("game.in_the_mud_nearby_fresh_footprints_from_1279")}${w.shoe[w.A]}.`, 'clue');
                    }
                    else if (!this.examined['peg']) {
                        this.examined['peg'] = true;
                        this.ui.log(L("game.if_there_were_footprints_here_the_drizzle_has_washed_t_1284"), 'dim');
                    }
                }
            }
            if (n === w.fragNode && !this.found.frg) {
                this.found.frg = true;
                got = true;
                this.addCard({ k: 'frg', color: w.color[w.A], node: n }, L("game.scene_1287"));
                this.ui.log(`${L("game.caught_on_the_1288")}${FRAG_SPOT[n]}${L("game.a_clothing_fiber_1289")}${w.color[w.A]}.`, 'clue');
            }
            if (!got)
                this.ui.log(pickR(FLAVOR[n]), 'dim');
            this.ui.update();
        }
        sniff(target) {
            if (this.over || this.busy)
                return;
            if (this.en < 2)
                return this.ui.log(L("game.not_enough_energy_even_to_hold_the_leash_1293"), 'warn');
            const w = this.w;
            const d = x => Math.max(Math.abs(this.ent[x].x - this.p.x), Math.abs(this.ent[x].y - this.p.y));
            const cands = ['lu', ...NPCS].filter(x => this.visible(x) && d(x) <= 1);
            if (!target && cands.length)
                return this.ui.dialog({ who: null, text: L("game.sniff_whom_1296"), options: [
                        ...cands.map(x => ({ label: nm(x), fn: () => { this.ui.closeDialog(); this.sniff(x); } })),
                        { label: L("game.sniff_the_ground_1297"), fn: () => { this.ui.closeDialog(); this.sniff('ground'); } },
                        { label: L("game.leave_1299"), fn: () => this.ui.closeDialog() }
                    ] });
            const near = target === 'ground' ? null : target || cands[0];
            this.en -= 2;
            this.advance(2);
            if (this.over)
                return;
            if (near === 'lu')
                return this.ui.log(L("game.christopher_runs_up_to_lu_wags_his_tail_and_tries_to_l_1302"), 'dim');
            if (near) {
                const c = this.addCard({ k: 'snf', x: near, smell: w.smell[near], contact: w.contact[near] }, L("game.dog_1305"));
                this.sniffed[near] = true;
                this.ui.log(`${L("game.christopher_stretches_his_bearded_muzzle_toward_1306")}${nm(near)}${L("game.odor_of_1307")}${w.smell[near]}. ` + (w.contact[near] ? L("game.he_growls_softly_hair_standing_on_end_and_keeps_sniffi_1309") : L("game.he_wags_his_tail_and_soon_looks_for_something_else_to__1310")), c ? 'clue' : 'dim');
                return this.ui.update();
            }
            const n = this.node;
            if (n === w.S) {
                const c = this.addCard({ k: 'odr', smell: w.smell[w.A], node: n }, L("game.dog_1314"));
                this.found.odr = true;
                this.ui.log(`${L("game.christopher_circles_1315")}${NODES[n].locationPhrase}${L("game.stubborn_as_ever_the_scene_smells_of_1316")}${w.smell[w.A]}.`, c ? 'clue' : 'dim');
            }
            else if (n && n === w.fragNode && !this.found.frg)
                this.ui.log(L("game.christopher_scratches_the_ground_plants_his_paws_and_r_1320"), 'hint');
            else
                this.ui.log(pickR([L("game.christopher_sniffs_the_damp_air_sneezes_and_sniffs_aga_1322"), L("game.christopher_excitedly_chases_a_leaf_blown_along_by_the_1323"), L("game.christopher_perks_up_his_ears_shakes_his_wet_beard_and_1324"), L("game.christopher_insists_on_sniffing_the_same_corner_nothin_1325")]), 'dim');
            this.ui.update();
        }
        useItem(type) {
            if (this.over || this.busy)
                return;
            if (type === 'monster') {
                if (!this.monster)
                    return this.ui.log(L("game.no_monster_left_1328"), 'warn');
                this.monster--;
                this.en = Math.min(100, this.en + 30);
                this.san -= 4;
                this.monsterUntil = this.min + 10;
                this.ui.log(L("game.ice_cold_monster_ultra_white_30_energy_faster_steps_fo_1330"), 'item');
                this.advance(0.5);
            }
            else {
                if (!this.cig)
                    return this.ui.log(L("game.no_cigarettes_left_1332"), 'warn');
                this.cig--;
                this.san = Math.min(100, this.san + 12);
                this.hp -= 4;
                this.emberUntil = this.min + 3;
                const fakes = this.cards.filter(c => c.fake).slice(0, 2);
                this.cards = this.cards.filter(c => !fakes.includes(c));
                this.ui.log(L("game.you_light_a_cigarette_the_ember_glows_in_the_darkness__1334") + (fakes.length ? `${L("game.the_smoke_settles_your_thoughts_1335")}${fakes.length}${L("game.false_note_s_vanish_from_the_diary_1336")}` : ''), 'item');
                this.advance(2);
            }
            this.checkDeath();
            this.ui.update();
        }
        talk(x) {
            if (this.socialWorld && !this.over) {
                for (const n of NPCS) {
                    if (n === x || this.refusing[n] || !this.visible(n) || Math.max(Math.abs(this.ent[n].x - this.p.x), Math.abs(this.ent[n].y - this.p.y)) > 4)
                        continue;
                    const st = this.strategy.actors[n];
                    if (st.lastObserved === x && this.min - (st.lastObservedAt ?? -99) < 5)
                        continue;
                    st.lastObserved = x;
                    st.lastObservedAt = this.min;
                    this.strategy.event(n, "observation", L("game.i_noticed_cl_udio_approaching_1340") + nm(x), x);
                }
            }
            if (this.refusing[x])
                return this.menuNPC(x);
            const w = this.w;
            if (!this.seen[x]) {
                this.seen[x] = true;
                this.addCard({ k: 'vis', x, shoe: w.shoe[x], color: w.color[x] }, L("game.observation_1342"));
                this.ui.log(`${L("game.you_notice_1343")}${nm(x)}: ${w.shoe[x]}${L("game.clothing_1345")}${w.color[x]}.`, 'clue');
            }
            this.menuNPC(x, null);
        }
        qtext(x, kind) {
            const qt = this.qt || (this.qt = {});
            const key = x + ':' + kind;
            if (!qt[key]) {
                const w = this.w, T = FORMS_OF_ADDRESS[x];
                const c = { a: E.bLabel(w.w0), b: E.hhmm(E.blockTime(w.w1) + 5), locationPhrase: NODES[w.S].locationPhrase, h: w.time, victim: w.scenario.victim };
                qt[key] = pickR(QV[kind])(T.voc, T.pr, c);
            }
            return qt[key];
        }
        sceneSet(x) {
            const t = this.w.testimony[x], S = this.w.S, cb = this.w.cb;
            return t.saw.filter(c => (c.node === S || E.ADJ[S].includes(c.node)) && c.t0 <= cb + 1 && c.t1 >= cb - 1);
        }
        otherSet(x) { const sc = this.sceneSet(x); return this.w.testimony[x].saw.filter(c => !sc.includes(c)); }
        confrontables(x) { return this.real.filter(c => c.k === 'claim' && c.subject === x && c.speaker !== x && !(this.asked[x].conf || {})[c.id]); }
        menuNPC(x, text, q) {
            if (this.over)
                return;
            if (this.refusing[x])
                return this.ui.dialog({ who: x, text: ({ bento: L("game.son_after_that_accusation_i_ve_got_nothing_else_to_say_1350"), fiscal: L("game.we_re_done_i_will_provide_you_with_no_further_informat_1351"), tereza: L("game.my_dear_after_that_i_d_rather_stay_quiet_1352"), guri: L("game.my_advisers_recommend_silence_i_won_t_cooperate_anymor_1353"), leitor: L("game.i_ve_already_paid_dearly_for_something_i_didn_t_do_lea_1354") })[x], options: [{ label: L("game.leave_1355"), fn: () => this.ui.closeDialog() }], accusable: true });
            const a = this.asked[x] || (this.asked[x] = {});
            const o = [], tick = k => a[k] ? '✓ ' : '';
            o.push({ label: tick('self') + this.qtext(x, 'self'), fn: () => this.ask(x, 'self') });
            o.push({ label: tick('scene') + this.qtext(x, 'scene'), fn: () => this.ask(x, 'scene') });
            if (a.scene)
                o.push({ label: tick('other') + this.qtext(x, 'other'), fn: () => this.ask(x, 'other') });
            o.push({ label: tick('victim') + this.qtext(x, 'victim'), fn: () => this.askVictim(x) });
            o.push({ label: VOICES[x].topic + ' (1 min)', fn: () => this.smallTalk(x) });
            o.push({ label: L("game.ask_about_someone_else_1370"), fn: () => this.menuAbout(x) });
            o.push({ label: L("game.hear_impressions_of_others_1_min_1371"), fn: () => this.menuOpinions(x) });
            if (this.confrontables(x).length)
                o.push({ label: L("game.challenge_with_a_diary_statement_1372"), fn: () => this.menuConfrontClaim(x) });
            o.push({ label: L("game.insist_6_en_1373"), fn: () => this.press(x) });
            const frg = this.real.find(c => c.k === 'frg');
            if (frg && !a.frg)
                o.push({ label: `${L("game.show_the_fiber_1375")}${frg.color}`, fn: () => this.showFrag(x, frg) });
            o.unshift({ label: L("game.free_conversation_1377") + (this.social.states[x].memory.length ? L("game.continue_1378") : L("game.ask_persuade_1379")), fn: () => this.ui.freeAsk(x), hot: true });
            if (this.board.locked && this.board.suspect === x)
                o.unshift({ label: L("game.confront_with_evidence_1380"), fn: () => this.confront(x), hot: true });
            o.push({ label: L("game.leave_1381"), fn: () => this.ui.closeDialog() });
            this.ui.dialog({ who: x, q, text: text || (this.strategy.actors[x].pressure >= 20 && tacticReaction(x, { tactic: this.strategy.actors[x].tactic })) || pickR(VOICES[x].greet), options: o, accusable: true });
        }
        menuOpinions(x) { if (this.over || this.busy || this.refusing[x] || !this.adjacentAll().includes(x))
            return; this.ui.dialog({ who: x, text: L("game.whose_personal_impressions_do_you_want_to_hear_this_is_1382"), options: [...NPCS.filter(n => n !== x).map(n => ({ label: nm(n), fn: () => this.askOpinion(x, n) })), { label: L("game.back_1383"), fn: () => this.menuNPC(x) }] }); }
        askOpinion(x, n) { if (this.over || this.busy || this.refusing[x] || !this.adjacentAll().includes(x) || !NPCS.includes(n) || n === x)
            return; this.advance(1); if (this.over)
            return; const q = L("game.what_s_your_impression_of_1384") + nm(n) + '?'; const text = L("game.personal_impression_not_testimony_1386") + this.strategy.opinion(x, n); this.strategy.event(x, "question", L("game.question_about_relationships_1388")); this.social.remember(x, q, text); this.menuNPC(x, text, q); }
        smallTalk(x) {
            this.advance(1);
            if (this.over)
                return;
            this.converse(x, VOICES[x].topic, 'banter', { claims: [] });
        }
        async converse(x, q, intent, d, after) {
            this.ui.log(`Cláudio: ${q}`, 'me');
            this.busy = true;
            this.ui.dialog({ who: x, q, text: null, options: [] });
            const revision = this.dialogRevision;
            const txt = await this.speak(x, intent, Object.assign({ q }, d));
            if (revision !== this.dialogRevision || this.over)
                return;
            this.busy = false;
            if (after)
                after();
            this.social.remember(x, q, txt);
            this.menuNPC(x, txt, q);
        }
        async ask(x, intent) {
            if (this.en < 3)
                return this.menuNPC(x, L("game.you_re_too_exhausted_a_monster_might_help_1393"));
            const t = this.w.testimony[x], a = this.asked[x];
            const first = !a[intent];
            a[intent] = true;
            this.en -= 3;
            this.advance(2);
            if (this.over)
                return;
            if (first)
                this.strategy.event(x, "interrogation", L("game.question_about_1395") + (intent === 'self' ? L("game.my_movements_1397") : L("game.what_i_observed_1398")));
            const claims = intent === 'self' ? t.self : intent === 'scene' ? this.sceneSet(x) : this.otherSet(x);
            if (first) {
                claims.forEach(c => this.addCard(c, nm(x)));
                if (intent !== 'self')
                    this.hallucinate(x);
            }
            this.converse(x, this.qtext(x, intent), intent, { claims, gap: intent === 'self' ? t.gap : null });
        }
        menuAbout(x) {
            const opts = NPCS.filter(n => n !== x).map(n => ({ label: `${L("game.and_1403")}${nm(n)}? ${language === "en" ? "Did you" : cap(FORMS_OF_ADDRESS[x].pr)}${L("game.notice_1405")}${n === 'tereza' ? L("game.her_1407") : L("game.him_1408")}?`, fn: () => this.askAbout(x, n) }));
            opts.push({ label: L("game.back_1410"), fn: () => this.menuNPC(x, '...') });
            this.ui.dialog({ who: x, text: L("game.who_is_cl_udio_asking_about_1_en_1_min_1412"), options: opts });
        }
        askAbout(x, n) {
            if (this.en < 1)
                return this.menuNPC(x, L("game.you_re_out_of_energy_1413"));
            const a = this.asked[x];
            a.about = a.about || {};
            this.en -= 1;
            this.advance(1);
            if (this.over)
                return;
            if (!a.about[n])
                this.strategy.event(x, "question", L("game.cl_udio_asked_about_1415") + nm(n), n);
            const t = this.w.testimony[x];
            const claims = [...t.saw, ...(this.keyGot[x] && t.key ? [t.key] : [])].filter(c => c.subject === n);
            if (!a.about[n]) {
                a.about[n] = true;
                claims.forEach(c => this.addCard(c, nm(x)));
            }
            this.converse(x, `${L("game.and_1416")}${nm(n)}? ${language === "en" ? "Did you" : cap(FORMS_OF_ADDRESS[x].pr)}${L("game.notice_1418")}${n === 'tereza' ? L("game.her_1420") : L("game.him_1421")}?`, 'about', { claims, target: n });
        }
        askVictim(x) {
            this.asked[x].victim = true;
            this.advance(1);
            if (this.over)
                return;
            this.converse(x, this.qtext(x, 'victim'), 'victim', { claims: [], text: `"${this.tie[x]}"` });
        }
        menuConfrontClaim(x) {
            const opts = this.confrontables(x).map(c => ({ label: `#${c.n}: ${nm(c.speaker)}${L("game.said_that_1430")}${x === 'guri' ? L("game.saw_you_1432") : L("game.saw_1433") + FORMS_OF_ADDRESS[x].pr} ${NODES[c.node].locationPhrase} ${E.spanShort(c.t0, c.t1)}`, fn: () => this.confrontClaim(x, c) }));
            opts.push({ label: L("game.back_1437"), fn: () => this.menuNPC(x, '...') });
            this.ui.dialog({ who: x, text: L("game.which_statement_does_cl_udio_present_2_en_2_min_1439"), options: opts });
        }
        confrontClaim(x, c) {
            if (this.en < 2)
                return this.menuNPC(x, L("game.you_re_out_of_energy_1440"));
            const w = this.w, a = this.asked[x];
            (a.conf = a.conf || {})[c.id] = true;
            this.en -= 2;
            this.advance(2);
            if (this.over)
                return;
            this.strategy.event(x, "contradiction", L("game.cl_udio_presented_a_statement_from_1442") + nm(c.speaker), c.speaker);
            this.strategy.hear(x, c);
            const q = `${nm(c.speaker)}${L("game.said_that_1444")}${x === 'guri' ? L("game.saw_you_1446") : L("game.saw_1447") + FORMS_OF_ADDRESS[x].pr} ${NODES[c.node].locationPhrase} ${E.spanLabel(c.t0, c.t1)}${L("game.is_that_true_1450")}`;
            let isTrue = true;
            for (let b = c.t0; b <= c.t1; b++)
                if (w.pos[x][b] !== c.node)
                    isTrue = false;
            const mine = w.testimony[x].self;
            const clash = mine.some(m => E.contradicts(m, c)) || (c.node === w.S && c.t0 <= w.cb && c.t1 >= w.cb);
            let text, extra, note = null, times = [];
            if (x === w.A && isTrue && clash) {
                text = pickR([L("game.swallows_nervously_must_have_confused_me_with_someone__1451"), `"${nm(c.speaker)}${L("game.that_person_sees_things_i_no_it_wasn_t_me_1453")}`]);
                extra = L("game.you_were_caught_in_a_contradiction_deny_it_nervously_a_1454");
                note = `${nm(x)}${L("game.faltered_upon_hearing_statement_1456")}${c.n}${L("game.from_1457")}${nm(c.speaker)}.`;
                this.san -= 1;
            }
            else if (isTrue) {
                text = pickR([L("game.yes_i_passed_by_so_what_1459"), L("game.right_i_was_there_1460"), L("game.i_was_there_sure_i_didn_t_hide_it_1461")]);
                extra = L("game.confirm_naturally_that_you_were_there_without_adding_f_1462");
            }
            else {
                const real = w.testimony[x].self.find(m => m.t0 <= c.t1 && m.t1 >= c.t0) || { node: w.pos[x][c.t0], t0: c.t0, t1: c.t0 };
                text = `${L("game.a_lie_1463")}${E.spanLabel(real.t0, real.t1).replace(/^./, s => s.toUpperCase())}${L("game.i_was_1464")}${NODES[real.node].locationPhrase}${L("game.whoever_told_you_that_is_making_things_up_1465")}`;
                extra = `${L("game.deny_firmly_and_indignantly_say_you_were_1466")}${NODES[real.node].locationPhrase} ${E.spanLabel(real.t0, real.t1)}.`;
                times = [E.bLabel(real.t0), E.hhmm(E.blockTime(real.t1) + 5)];
                note = `${nm(x)}${L("game.firmly_denied_statement_1470")}${c.n}${L("game.from_1471")}${nm(c.speaker)}${L("game.and_seemed_sincere_1472")}`;
            }
            this.converse(x, q, 'confront', { claims: [], text, extra, times }, () => {
                if (note) {
                    this.addCard({ k: "note", text: note }, L("game.reaction_1475"));
                    this.ui.log(note, 'clue');
                }
            });
        }
        press(x) {
            if (this.en < 6)
                return this.menuNPC(x, L("game.you_don_t_have_the_energy_to_insist_right_now_1477"));
            this.en -= 6;
            this.advance(2);
            if (this.over)
                return;
            this.strategy.event(x, "pressure", L("game.cl_udio_insisted_on_getting_information_1479"));
            if (!this.dealt[x]) {
                if (this.social.states[x].irritation >= 40) {
                    this.san -= 1;
                    return this.menuNPC(x, `${nm(x)}${L("game.crosses_their_arms_1481")}${VOICES[x].pressure}"`);
                }
                const phys = this.real.filter(c => ['obj', 'peg', 'frg', 'odr'].includes(c.k));
                const opts = [];
                if (this.cig > 0)
                    opts.push({ label: L("game.offer_a_cigarette_1487"), fn: () => { this.cig--; this.confide(x, L("game.the_cigarette_disappears_into_the_coat_pocket_1488")); } });
                if (phys.length)
                    opts.push({ label: L("game.show_a_physical_clue_1489"), fn: () => this.confide(x, L("game.their_expression_changes_at_the_sight_of_the_clue_1490")) });
                opts.push({ label: L("game.let_it_go_1491"), fn: () => this.menuNPC(x, L("game.all_right_then_1492")) });
                return this.ui.dialog({ who: x, text: `${nm(x)}${L("game.looks_away_i_can_tell_you_something_but_there_s_a_pric_1494")}`, options: opts });
            }
            this.san -= 1;
            this.menuNPC(x, VOICES[x].pressure);
        }
        showFrag(x, frg) {
            const w = this.w;
            this.asked[x].frg = true;
            this.advance(1);
            if (this.over)
                return;
            if (x === w.A && !this.fled[x])
                return this.shortcut(x, frg);
            this.menuNPC(x, `${nm(x)}${L("game.looks_at_the_fiber_1496")}${frg.color}${L("game.and_opens_their_coat_it_s_1497")}${w.color[x]}${L("game.that_s_not_mine_1498")}`);
        }
        collectKey(x) {
            if (this.over || this.keyGot[x] || !this.w.testimony[x].key)
                return null;
            this.keyGot[x] = true;
            this.dealt[x] = true;
            const k = this.w.testimony[x].key;
            this.addCard(k, nm(x) + L("game.trade_1499"));
            this.advance(1);
            return k;
        }
        confession(x, via) {
            this.dealt[x] = true;
            const k = this.w.testimony[x].key;
            if (k && !this.keyGot[x]) {
                this.keyGot[x] = true;
                this.addCard(k, nm(x) + ' (' + via + ')');
                return templateVoice(x, 'key', { claims: [k] });
            }
            const s = this.w.secret[x];
            if (s && !this.secretGot[x]) {
                this.secretGot[x] = true;
                this.addCard({ k: "note", text: `${nm(x)}${L("game.confided_i_1505")}${s}${L("game.claims_it_has_nothing_to_do_with_the_death_1506")}` }, nm(x) + ' (' + via + ')');
                return pickR(VOICES[x].key) + `${L("game.i_1509")}${s}${L("game.but_that_has_nothing_to_do_with_the_death_you_know_1510")}`;
            }
            return pickR(VOICES[x].empty);
        }
        confide(x, intro) {
            if (this.over)
                return;
            this.advance(1);
            if (this.over)
                return;
            const txt = this.confession(x, L("game.trade_1511"));
            this.social.remember(x, L("game.come_on_tell_me_what_you_know_1512"), txt);
            this.menuNPC(x, intro + ' ' + txt);
        }
        async askFree(x, q) {
            if (this.over || this.busy || !NPCS.includes(x) || this.refusing[x] || !this.adjacentAll().includes(x))
                return;
            q = String(q || '').trim().slice(0, 300);
            if (!q)
                return;
            this.advance(2);
            if (this.over)
                return;
            const revision = ++this.dialogRevision, claims = this.knownBy(x).claims;
            this.strategy.event(x, ["pressure", "hostility"].includes(localApproach(q)) ? "pressure" : "question", 'Cláudio: ' + q);
            const ids = localIds(x, q, claims);
            const fb = { speech: ids.length ? VOICES[x].prefix[0] + L("game.let_s_take_it_one_step_at_a_time_1520") : VOICES[x].match.test(q) ? templateVoice(x, 'banter', {}) : VOICES[x].greet[0], ids, approach: localApproach(q), ...this.strategy.fallback(x, q, this.litCount()) };
            this.ui.log(`Cláudio: ${q}`, 'me');
            this.busy = true;
            this.ui.dialog({ who: x, q, text: null, options: [], freePending: true });
            const result = this.voice ? await Promise.race([Promise.resolve().then(() => this.voice(x, 'free', { q, claims, social: this.social.context(x), strategy: this.strategy.context(x, q), scenario: this.w.scenario }, fb)).catch(() => fb), new Promise(resolve => { this.skipFree = () => resolve(fb); })]) : fb;
            if (revision !== this.dialogRevision || this.over)
                return;
            this.skipFree = null;
            this.busy = false;
            const reply = result && typeof result === 'object' && APPROACHES.includes(result.approach) ? result : fb;
            const selected = claims.filter(c => Array.isArray(reply.ids) && reply.ids.includes(c.id)).slice(0, 3);
            this.social.apply(x, q, reply.approach, this.litCount());
            const plan = this.strategy.commit(x, q, reply, this.litCount());
            if (plan.fresh) {
                const s = this.social.states[x];
                s.cooperation = clamp(s.cooperation + (plan.tactic === "cooperate" ? 2 : plan.tactic === "reserve" ? -2 : 0));
            }
            const diversion = plan.tactic === "deflect" && plan.target && OPINION_WORDS.test(norm(q)) ? L("game.personal_impression_not_testimony_perhaps_it_s_worth_t_1530") + nm(plan.target) + L("game.it_s_only_an_impression_1531") : '';
            let unlocked = null, confided = '';
            if (!["hostility", "pressure"].includes(reply.approach) && !["hostility", "pressure"].includes(localApproach(q)) && asksInfo(q) && this.social.ready(x) && !this.dealt[x]) {
                const k = this.w.testimony[x].key;
                if (k && !this.keyGot[x]) {
                    unlocked = k;
                    this.keyGot[x] = true;
                    this.dealt[x] = true;
                    selected.push(k);
                }
                else
                    confided = this.confession(x, L("game.persuasion_1538"));
            }
            selected.forEach(c => this.addCard(c, nm(x) + (c === unlocked ? L("game.persuasion_1539") : '')));
            const facts = selected.length ? L("game.recorded_statement_1541") + selected.map(c => canonicalDeposition(c, x)).join('\n') : '';
            const response = L("game.reaction_1544") + String(reply.speech || fb.speech) + (reply === fb && tacticReaction(x, plan) ? ' ' + tacticReaction(x, plan) : '') + diversion + (unlocked ? '\n\n' + VOICES[x].key[0] + L("game.you_ve_earned_my_trust_1548") : '') + (confided ? L("game.you_ve_earned_my_trust_1550") + confided : '') + facts;
            this.social.remember(x, q, response);
            this.ui.update();
            this.menuNPC(x, response, q);
        }
        talkLu() {
            const opts = [];
            opts.push({ label: L("game.discuss_hypotheses_with_lu_1552"), fn: () => this.ui.freeAsk('lu'), hot: true });
            opts.push({ label: L("game.share_notes_1554") + this.lu.shared.length, fn: () => this.luShareMenu() });
            opts.push({ label: L("game.review_investigation_with_lu_1555"), fn: () => this.luReview() });
            opts.push({ label: L("game.chat_san_1556"), fn: () => this.luChat() });
            opts.push({ label: L("game.ask_about_the_victim_and_the_case_1557"), fn: () => this.askLuAboutCase() });
            this.real.filter(c => c.key && !this.luShown[c.id]).forEach(c => opts.push({ label: `${L("game.show_what_1558")}${nm(c.speaker)}${L("game.said_1559")}`, fn: () => this.luOracle(c) }));
            opts.push({ label: L("game.leave_1560"), fn: () => this.ui.closeDialog() });
            const mood = this.lu.trust >= 60 ? pickR([L("game.found_anything_cl_udio_1561"), L("game.have_you_noticed_the_lights_flickering_strange_but_let_1562"), L("game.what_s_fact_and_what_s_just_an_impression_so_far_1563")]) : this.lu.trust >= 30 ? L("game.lu_crosses_her_arms_what_is_it_1564") : L("game.lu_doesn_t_even_look_at_you_1565");
            this.ui.dialog({ who: 'lu', text: this.luText || mood, options: opts });
            this.luText = null;
        }
        luShareMenu() { if (this.over || this.busy)
            return; const available = this.cards.filter(c => !this.lu.shared.some(s => s.n === c.n)); const opts = available.map(c => ({ label: '#' + c.n + ' · ' + publicLabel(c), fn: () => this.luShare([c.n]) })); if (available.length > 1)
            opts.unshift({ label: L("game.share_all_1569") + available.length + L("game.notes_1_min_1570"), fn: () => this.luShare(available.map(c => c.n)), hot: true }); opts.push({ label: L("game.back_1571"), fn: () => this.talkLu() }); this.ui.dialog({ who: 'lu', text: available.length ? L("game.what_do_you_want_to_show_me_i_ll_only_consider_what_yo_1573") : L("game.i_already_have_all_the_notes_you_showed_me_or_there_ar_1574"), options: opts }); }
        luShare(ids) { if (this.over || this.busy || !this.adjacentAll().includes('lu'))
            return; const cs = this.cards.filter(c => ids.includes(c.n) && !this.lu.shared.some(s => s.n === c.n)); if (!cs.length)
            return this.talkLu(); this.advance(1); if (this.over)
            return; this.lu.shared.push(...cs.map(publicSnapshot)); this.luText = `${L("game.i_noted_1576")}${cs.length} ${cs.length === 1 ? L("game.note_1578") : L("game.notes_1579")}${L("game.now_we_can_form_hypotheses_without_confusing_observati_1580")}`; this.luRemember(L("game.shared_1581") + cs.map(c => '#' + c.n).join(', '), this.luText); this.talkLu(); }
        luRemember(q, reply) { this.lu.memory.push({ q: String(q).slice(0, 300), reply: String(reply).slice(0, 900) }); if (this.lu.memory.length > 18)
            this.lu.memory.shift(); }
        luReview() { const text = this.lu.shared.length ? this.lu.shared.map(c => '#' + c.n + ' · ' + publicLabel(c)).join('\n') : L("game.you_haven_t_shared_any_notes_with_me_yet_1587"); const history = this.lu.memory.slice(-5).map(m => 'Cláudio: ' + m.q + '\nLu: ' + m.reply).join('\n\n'); this.ui.dialog({ who: 'lu', text: L("game.shared_notes_1592") + text + (history ? L("game.recent_conversations_1593") + history : ''), options: [{ label: L("game.back_1595"), fn: () => this.talkLu() }] }); }
        async luDiscuss(q) {
            if (this.over || this.busy || !this.adjacentAll().includes('lu'))
                return;
            q = String(q || '').trim().slice(0, 300);
            if (!q)
                return;
            this.advance(2);
            if (this.over)
                return;
            const plans = luPlans(this.lu.shared), query = norm(q);
            const target = NPCS.find(x => norm(nm(x)).split(' ').some(t => t.length > 3 && query.includes(t)));
            const preferred = plans.find(p => p.target === target && target) || plans[0];
            const personal = R("game.rule_655_0").test(query) && !R("game.rule_655_1").test(query);
            const fb = { speech: personal ? L("game.it_worries_me_too_but_a_hypothesis_doesn_t_become_fact_1599") : this.lu.trust >= 50 ? L("game.let_s_put_the_pieces_together_without_confusing_certai_1600") : L("game.i_can_help_but_don_t_pressure_me_1601"), plans: personal ? [] : [preferred.id] };
            const rev = ++this.dialogRevision;
            this.busy = true;
            this.ui.log('Cláudio: ' + q, 'me');
            this.ui.dialog({ who: 'lu', q, text: null, options: [], freePending: true });
            const result = this.voice ? await Promise.race([Promise.resolve().then(() => this.voice('lu', 'lu', { q, plans, shared: this.lu.shared.map(c => ({ n: c.n, text: publicLabel(c) })), memory: this.lu.memory.slice(-5), trust: this.lu.trust, lit: this.litCount() }, fb)).catch(() => fb), new Promise(resolve => { this.skipFree = () => resolve(fb); })]) : fb;
            if (this.over || rev !== this.dialogRevision)
                return;
            this.busy = false;
            this.skipFree = null;
            const r = result && Array.isArray(result.plans) ? result : fb;
            const selected = plans.filter(p => r.plans.includes(p.id)).slice(0, 2);
            const approach = localApproach(q);
            this.lu.trust = clamp(this.lu.trust + (["hostility", "pressure"].includes(approach) ? -4 : ["empathy", "respect", "precision"].includes(approach) ? 2 : 0));
            const text = r.speech + (selected.length ? L("game.hypotheses_and_next_steps_1612") + selected.map(p => p.text).join('\n\n') : '');
            this.luRemember(q, text);
            this.luText = text;
            this.ui.log('Lu: ' + text, 'npc');
            this.talkLu();
            this.ui.update();
        }
        luChat() {
            if (this.min - this.lu.lastChat < 8) {
                this.luText = L("game.not_now_cl_udio_get_back_to_work_1617");
                return this.talkLu();
            }
            this.lu.lastChat = this.min;
            this.advance(3);
            if (this.over)
                return;
            this.san = Math.min(100, this.san + 6);
            this.lu.trust = Math.min(100, this.lu.trust + 4);
            this.ui.log(pickR([L("game.cl_udio_lu_i_understand_your_concern_but_what_evidence_1618"), L("game.cl_udio_i_m_trying_to_separate_what_i_observe_from_wha_1619"), L("game.cl_udio_there_was_something_else_i_wanted_to_ask_you_n_1620")]), 'me');
            this.luText = pickR(LU_CHAT) + ' (+6 SAN)';
            this.luRemember(L("game.supportive_conversation_1623"), this.luText);
            this.ui.update();
            this.talkLu();
        }
        askLuAboutCase() {
            this.advance(3);
            if (this.over)
                return;
            this.lu.trust -= 15;
            this.san -= 3;
            if (this.lu.story < this.w.scenario.lu.length)
                this.luText = `"${this.w.scenario.lu[this.lu.story++]}"`;
            else
                this.luText = L("game.i_ve_told_you_what_i_could_stop_pressuring_me_1626");
            this.luRemember(L("game.asked_about_the_victim_1627"), this.luText);
            if (this.lu.trust < 30 && !this.lu.away) {
                this.lu.away = true;
                const dark = NODE_IDS.filter(n => this.isDark(NODES[n].q));
                const far = NODE_IDS.slice().sort((a, b) => E.TRAVEL[b][this.node || 'start'] - E.TRAVEL[a][this.node || 'start']);
                const dest = dark[0] || far[0];
                const occ = this.occupied();
                occ.add(this.k(this.p));
                occ.delete(this.k(this.ent.lu));
                this.ent.lu = this.placeIn(dest, occ);
                this.npcNode.lu = dest;
                this.ui.closeDialog();
                this.ui.log(this.luText, 'npc');
                this.ui.log(`${L("game.lu_walks_away_without_a_word_toward_1631")}${NODES[dest].locationPhrase}${L("game.low_trust_1632")}`, 'warn');
                return this.ui.update();
            }
            this.ui.update();
            this.talkLu();
        }
        luOracle(key) {
            if (this.over || this.en < 2) {
                if (!this.over) {
                    this.luText = L("game.you_re_too_tired_to_explain_1634");
                    this.talkLu();
                }
                return;
            }
            this.luShown[key.id] = true;
            this.en -= 2;
            this.advance(3);
            if (this.over)
                return;
            if (!this.lu.shared.some(c => c.n === key.n))
                this.lu.shared.push(publicSnapshot(key));
            const plan = luPlans(this.lu.shared).find(p => p.refs.includes(key.n) && p.refs.length > 1) || luPlans(this.lu.shared).find(p => p.refs.includes(key.n));
            this.luText = plan ? plan.text : L("game.let_s_check_this_against_another_statement_1635");
            this.luRemember(L("game.showed_1636") + key.n, this.luText);
            this.lu.trust = clamp(this.lu.trust + 3);
            this.ui.update();
            this.talkLu();
        }
        closeBoard(s, a, b, e) {
            if (this.over)
                return { ok: false, why: L("game.the_game_is_over_1637"), cost: false };
            if (!NPCS.includes(s) || !a || !b || !e || a.n === b.n || ![a, b, e].every(c => this.cards.includes(c)))
                return { ok: false, why: L("game.select_a_suspect_two_different_statements_and_a_piece__1638"), cost: false };
            if (this.refusing[s])
                return { ok: false, why: `${nm(s)}${L("game.has_already_been_ruled_out_by_an_earlier_accusation_no_1640")}`, cost: false };
            if (this.board.locked)
                return { ok: false, why: L("game.the_board_is_already_locked_go_confront_the_suspect_1641") };
            if (this.en < 10)
                return { ok: false, why: L("game.not_enough_energy_to_close_the_board_10_1642"), cost: false };
            this.en -= 10;
            this.san -= 5;
            this.advance(1);
            if (this.over)
                return { ok: false, why: L("game.the_square_went_dark_before_the_deduction_1643") };
            const r = E.validateBoard(this.w, this.cards, s, a, b, e);
            if (r.ok) {
                this.board = { locked: true, suspect: s, sel: { a, b, e } };
                this.ui.log(`${L("game.eureka_the_board_locks_on_1644")}${nm(s)}${L("game.go_confront_them_1645")}`, 'win');
            }
            else {
                this.stats.boardFails++;
                this.san -= 20;
                this.ui.log(L("game.a_collapse_of_doubt_nothing_fits_20_san_the_clock_adva_1647"), 'warn');
                this.advance(8);
                this.accelerate();
            }
            this.checkDeath();
            this.ui.update();
            return r;
        }
        evidenceLine(e) {
            const w = this.w;
            if (e.k === 'peg')
                return `${L("game.the_footprint_from_1650")}${e.shoe}${L("game.at_the_scene_matches_your_footwear_1651")}`;
            if (e.k === 'frg')
                return `${L("game.the_fiber_1653")}${e.color}${L("game.caught_1654")}${NODES[e.node].locationPhrase}${L("game.is_from_your_clothing_1655")}`;
            if (e.k === 'odr')
                return `${L("game.the_scene_smells_of_1657")}${e.smell}${L("game.just_like_you_1658")}`;
            if (e.k === 'snf')
                return L("game.the_dog_growled_at_you_you_had_contact_with_the_scene_1660");
            return L("game.the_clues_point_to_you_1661");
        }
        contradictionLine(a, b, s) {
            const mine = a.speaker === s ? a : b, other = mine === a ? b : a;
            return `${L("game.you_said_that_1662")}${mine.subject === s ? L("game.were_1663") : nm(mine.subject) + L("game.was_1664")} ${NODES[mine.node].locationPhrase} ${E.spanLabel(mine.t0, mine.t1)}${L("game.but_1667")}${nm(other.speaker)} ${other.subject === other.speaker ? L("game.was_there_1669") : L("game.saw_1670") + (other.subject === s ? L("game.you_1671") : nm(other.subject))} ${NODES[other.node].locationPhrase}${L("game.at_that_time_1673")}`;
        }
        payConfront() {
            if (this.over || this.en < 4)
                return false;
            this.en -= 4;
            this.san -= 3;
            this.advance(3);
            return !this.over;
        }
        confront(x) {
            if (this.over || !this.board.locked || this.board.suspect !== x)
                return;
            if (this.refusing[x]) {
                this.board = { locked: false, suspect: null, sel: null };
                return this.menuNPC(x);
            }
            if (!this.payConfront()) {
                if (!this.over)
                    this.menuNPC(x, L("game.not_enough_energy_to_confront_4_en_1674"));
                return;
            }
            const w = this.w, role = w.role[x], { a, b, e } = this.board.sel;
            const other = a.speaker === x ? b.speaker : a.speaker;
            const step3 = (text, after) => this.ui.dialog({ who: x, text, options: [{ label: L("game.continue_1675"), fn: after }] });
            const end = (msg) => { this.ui.log(msg, 'warn'); this.wrongAccusation(x); };
            const opener = VOICES[x].accuse;
            this.ui.dialog({ who: x, text: opener, options: [
                    { label: L("game.present_the_contradiction_1677"), fn: () => ex2() },
                    { label: L("game.stare_in_silence_1678"), fn: () => { this.san -= 2; ex2(); } },
                ] });
            const ex2 = () => {
                if (role === "killer") {
                    const psych = this.san < 40
                        ? L("game.look_at_you_cl_udio_shaking_you_don_t_even_know_what_s_1680")
                        : `${L("game.why_don_t_you_ask_lu_where_she_was_at_1681")}${w.time}${L("game.she_knows_more_about_this_case_than_anyone_1682")}`;
                    const opts = [
                        { label: `"${this.contradictionLine(a, b, x)}${L("game.and_1684")}${this.evidenceLine(e)}."`, fn: () => step3(`${nm(x)}${L("game.opens_their_mouth_but_nothing_comes_out_their_shoulder_1687")}${E.caseMotive(w.scenario)}."`, () => this.win("confrontation")) },
                        this.san < 40
                            ? { label: L("game.i_saw_you_in_the_dark_the_voices_told_me_1690"), fn: () => this.flee(x) }
                            : { label: L("game.lu_she_s_always_been_too_close_to_this_case_1691"), fn: () => { this.lu.trust -= 20; this.flee(x); } },
                        { label: L("game.i_m_calling_the_brigada_militar_right_now_1692"), fn: () => this.flee(x) },
                    ].sort(() => Math.random() - 0.5);
                    this.ui.dialog({ who: x, text: psych, options: opts });
                }
                else if (role === "neutral") {
                    const alibi = w.witness.find(ev => ev.target === x && ev.t === w.cb && ev.strong);
                    step3(`${L("game.at_1694")}${w.time}${L("game.i_was_1695")}${NODES[w.pos[x][w.cb]].locationPhrase}.${alibi ? ` ${nm(alibi.observer)}${L("game.was_beside_me_ask_them_1698")}` : ''}"`, () => step3(`${L("game.if_anyone_lied_in_this_story_it_was_1701")}${nm(other)}${L("game.i_told_the_truth_and_your_evidence_matches_me_by_chanc_1702")}`, () => end(`${nm(x)}${L("game.proves_their_innocence_the_deduction_failed_because_of_1704")}${nm(other)}.`)));
                }
                else {
                    const k = w.testimony[x].key;
                    step3(`${L("game.okay_fine_i_1706")}${w.secret[x]}${L("game.but_kill_someone_never_1707")}`, () => {
                        if (k && !this.keyGot[x]) {
                            this.keyGot[x] = true;
                            this.addCard(k, nm(x) + L("game.confession_1708"));
                        }
                        step3(`${L("game.and_there_s_more_1709")}${k ? templateVoice(x, 'key', { claims: [k] }).replace(L("game.okay_okay_1711"), '').replace(L("game.but_you_didn_t_hear_it_from_me_1713"), '') : ''}${L("game.whoever_told_you_that_1716")}${nm(other)}${L("game.is_playing_you_1717")}`, () => end(`${nm(x)}${L("game.confesses_a_separate_secret_but_is_not_the_killer_1719")}`));
                    });
                }
            };
        }
        shortcut(x, frg) {
            const opts = [
                { label: `${L("game.show_the_fiber_it_s_1720")}${frg.color}${L("game.from_your_clothes_and_it_was_1721")}${NODES[frg.node].locationPhrase}.`, fn: () => this.ui.dialog({ who: x, text: `${nm(x)}${L("game.takes_a_step_back_their_hand_goes_to_the_tear_in_their_1724")}${frg.color}${L("game.i_wanted_to_1725")}${E.caseMotive(this.w.scenario)}."`, options: [{ label: L("game.continue_1727"), fn: () => this.win("shortcut") }] }) },
                { label: L("game.say_the_brigada_militar_already_knows_everything_1729"), fn: () => this.flee(x) },
            ].sort(() => Math.random() - 0.5);
            this.ui.dialog({ who: x, text: `${nm(x)}${L("game.sees_the_fiber_1731")}${frg.color}${L("game.in_your_hand_and_freezes_the_silence_is_heavy_you_have_1732")}`, options: opts });
        }
        flee(x) {
            this.fleeCount++;
            this.fled[x] = true;
            this.san -= 15;
            this.ui.closeDialog();
            if (this.fleeCount >= 2) {
                this.ui.log(`${nm(x)}${L("game.vanishes_into_the_shadows_for_good_1734")}`, 'warn');
                return this.lose("escape");
            }
            const dark = NODE_IDS.filter(n => this.isDark(NODES[n].q));
            const dest = dark.length ? dark[Math.floor(Math.random() * dark.length)] : NODE_IDS[Math.floor(Math.random() * NODE_IDS.length)];
            const occ = this.occupied();
            occ.add(this.k(this.p));
            occ.delete(this.k(this.ent[x]));
            this.ent[x] = this.placeIn(dest, occ);
            this.npcNode[x] = dest;
            this.ui.log(`${nm(x)}${L("game.steps_back_and_blends_into_the_shadows_the_blackout_ac_1738")}`, 'warn');
            this.accelerate();
            this.checkDeath();
            this.ui.update();
        }
        reveal() {
            const w = this.w;
            const route = w.pos[w.A].slice(w.w0, w.w1 + 1).map((n, i) => `${E.bLabel(w.w0 + i)} ${NODES[n].shortName}`).join(' · ');
            const tr = { int: L("game.question_1744"), key: L("game.get_the_secret_from_1745"), snf: L("game.sniff_1746"), peg: L("game.examine_the_scene_1747"), odr: L("game.dog_at_the_scene_1748"), frg: L("game.find_the_fiber_1749") };
            const sol = (w.proof?.order || w.solution.order).map(id => { const [a, x] = id.split(':'); return (tr[a] || (a === 'monster' ? L("game.use_monster_1752") : a === 'cig' ? L("game.smoke_cigarette_1754") : a)) + (x ? ' ' + nm(x) : ''); }).join(' → ') + L("game.close_board_confront_1758") + (w.proof ? ` (${w.proof.t} min; HP ${w.proof.hp}, SAN ${w.proof.san}, EN ${w.proof.en})` : '');
            return { case: w.scenario.title, killer: nm(w.A), scene: NODES[w.S].name, time: w.time, lie: w.lie.description, route: route,
                informants: w.informants.map(nm).join(L("game.and_1765")), neutrals: w.neutrals.map(nm).join(L("game.and_1766")), solution: sol, seed: w.seed, mode: w.mode, motive: E.caseMotive(w.scenario), caseId: w.scenario.id, secrets: NPCS.map(n => `${nm(n)}${L("game.i_1768")}${w.secret[n]}"`).join(' · ') };
        }
        directAccuse(x) {
            if (this.over || !NPCS.includes(x))
                return { ok: false, reason: "unavailable" };
            if (this.refusing[x])
                return { ok: false, reason: "ruled_out" };
            this.finalAccused = x;
            this.ui.log(`${L("game.cl_udio_formally_accuses_1773")}${nm(x)}.`, 'warn');
            if (x === this.w.A) {
                this.win("accusation");
                return { ok: true, win: true };
            }
            return this.wrongAccusation(x);
        }
        wrongAccusation(x) {
            if (this.over || !NPCS.includes(x) || x === this.w.A || this.refusing[x])
                return { ok: false };
            this.finalAccused = x;
            this.stats.wrongAccusations++;
            this.dialogRevision++;
            this.skipFree?.();
            this.skipFree = null;
            this.busy = false;
            this.board = { locked: false, suspect: null, sel: null };
            this.refusing[x] = true;
            for (const n of NPCS)
                if (n === x || Math.max(Math.abs(this.ent[n].x - this.p.x), Math.abs(this.ent[n].y - this.p.y)) <= 4)
                    this.strategy.event(n, "accusation", L("game.there_was_a_public_accusation_1778"));
            this.ui.closeDialog();
            if (this.stats.wrongAccusations >= 2) {
                this.ui.log(`${L("game.second_incorrect_accusation_1779")}${nm(x)}${L("game.was_not_the_culprit_1780")}`, 'warn');
                this.lose("wrong_accusation");
                return { ok: true, win: false, over: true };
            }
            this.san = Math.max(0, this.san - 25);
            this.addCard({ k: "note", text: `${L("game.incorrect_accusation_1784")}${nm(x)}${L("game.was_ruled_out_as_the_perpetrator_1785")}` }, L("game.accusation_1786"));
            this.ui.log(`${L("game.wrong_accusation_1_2_1787")}${nm(x)}${L("game.is_not_the_killer_25_san_1788")}`, 'warn');
            this.ui.log(`${nm(x)}${L("game.refuses_to_cooperate_from_now_on_1791")}`, 'warn');
            this.accelerate();
            if (!this.over) {
                const occ = this.occupied();
                occ.add(this.k(this.p));
                const group = NPCS.filter(n => n !== x);
                for (const n of group)
                    occ.delete(this.k(this.ent[n]));
                for (const n of group) {
                    const spots = [];
                    for (let yy = 0; yy < H; yy++)
                        for (let xx = 0; xx < W; xx++) {
                            if (!E.walkable(xx, yy) || occ.has(xx + ',' + yy) || !this.isDark(MAP.Q[yy][xx]))
                                continue;
                            const node = E.nodeAt(xx, yy);
                            if (node && this.isDark(NODES[node].q))
                                spots.push({ x: xx, y: yy, node, d: Math.max(Math.abs(xx - this.p.x), Math.abs(yy - this.p.y)) });
                        }
                    const far = spots.filter(p => p.d > 3), dest = this.rng.pick(far.length ? far : spots);
                    if (dest) {
                        this.ent[n] = { x: dest.x, y: dest.y };
                        this.npcNode[n] = dest.node;
                        occ.add(this.k(dest));
                    }
                    else
                        occ.add(this.k(this.ent[n]));
                }
                this.ui.log(L("game.in_the_confusion_the_other_regulars_scatter_through_th_1794"), 'warn');
                this.checkDeath();
            }
            this.ui.update();
            return { ok: true, win: false, over: this.over };
        }
        win(how) {
            if (this.over)
                return;
            this.over = true;
            this.dialogRevision++;
            this.skipFree?.();
            this.skipFree = null;
            this.busy = false;
            this.ui.closeDialog();
            this.ui.end({ win: true, how, reveal: this.reveal(), clock: this.clock });
        }
        lose(why) {
            if (this.over)
                return;
            this.over = true;
            this.dialogRevision++;
            this.skipFree?.();
            this.skipFree = null;
            this.busy = false;
            this.ui.closeDialog && this.ui.closeDialog();
            let victim = null;
            if (why === "blackout" || why === "escape") {
                const pool = [];
                NPCS.filter(n => n !== this.w.A).forEach(n => pool.push([nm(n), 1]));
                pool.push(['Lu', 1 + (this.lu.trust < 30 ? 3 : 0)]);
                pool.push(['Cláudio', 1 + (this.san < 30 ? 2 : 0) + (this.hp < 40 ? 1 : 0)]);
                let tot = pool.reduce((s, p) => s + p[1], 0), r = Math.random() * tot;
                for (const [n, wt] of pool) {
                    r -= wt;
                    if (r <= 0) {
                        victim = n;
                        break;
                    }
                }
            }
            this.ui.end({ win: false, why, victim, accused: this.finalAccused ? nm(this.finalAccused) : null, reveal: this.reveal(), clock: this.clock });
        }
    }
    function verifyPlayable(w, board, solution) {
        const noop = () => { };
        let dialog = null, result = null;
        const ui = { log: noop, update: noop, dialog: d => { dialog = d; }, closeDialog: () => { dialog = null; }, end: r => { result = r; } };
        const options = [board.order, [...new Set([...solution.order, ...board.order])], [...new Set([...board.order, ...solution.order])]];
        for (const order of options) {
            dialog = null;
            result = null;
            const g = new Game(ui);
            g.initWorld(w);
            g.converse = noop;
            const steps = [];
            let moves = 0;
            const navigate = (target, person) => {
                for (let i = 0; i < 150 && !g.over; i++) {
                    const blocked = g.occupied(true);
                    const p = g.p;
                    const goal = (x, y) => person ? (Math.max(Math.abs(x - g.ent[target].x), Math.abs(y - g.ent[target].y)) <= 1) : E.nodeAt(x, y) === target && !g.isDark(NODES[target].q);
                    if (goal(p.x, p.y))
                        return true;
                    const q = [[p.x, p.y, null]], seen = new Set([g.k(p)]);
                    let first = null;
                    for (let j = 0; j < q.length; j++) {
                        const [x, y, f] = q[j];
                        if (goal(x, y)) {
                            first = f;
                            break;
                        }
                        for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                            const a = x + d[0], b = y + d[1], k = a + ',' + b;
                            if (!E.walkable(a, b) || blocked.has(k) || seen.has(k))
                                continue;
                            seen.add(k);
                            q.push([a, b, f || d]);
                        }
                    }
                    if (!first)
                        return false;
                    g.move(...first);
                    moves++;
                }
                return false;
            };
            const resource = (en = 0) => { if (g.en < en && g.monster > 0) {
                g.useItem('monster');
                steps.push('monster');
            } if (g.san < 28 && g.cig > 2) {
                g.useItem('cig');
                steps.push('cig');
            } return !g.over && g.en >= en; };
            let ok = true;
            for (const id of order) {
                const [a, x] = id.split(':');
                const person = ['int', 'key', 'snf'].includes(a), target = person ? x : a === 'frg' ? w.fragNode : w.S;
                const cost = a === 'int' ? 9 : a === 'key' ? 6 : a === 'snf' || a === 'odr' ? 2 : 0;
                if (!resource(cost + 14) || !navigate(target, person)) {
                    ok = false;
                    break;
                }
                if (a === 'int') {
                    g.talk(x);
                    g.ask(x, 'self');
                    g.ask(x, 'scene');
                    g.ask(x, 'other');
                }
                else if (a === 'key') {
                    if (!g.cig) {
                        ok = false;
                        break;
                    }
                    g.talk(x);
                    g.press(x);
                    g.cig--;
                    g.collectKey(x);
                }
                else if (a === 'snf')
                    g.sniff(x);
                else if (a === 'odr')
                    g.sniff('ground');
                else
                    g.examine(target);
                steps.push(id);
                g.checkDeath();
                if (g.over) {
                    ok = false;
                    break;
                }
            }
            if (!ok || g.over || !resource(14))
                continue;
            const cs = g.real, a = cs.find(c => c.id === board.pair[0]), b = cs.find(c => c.id === board.pair[1]), e = cs.find(c => c.k === board.evidence && (c.k !== 'snf' || c.x === w.A));
            const suspects = E.suspects(cs, w);
            if (suspects.length !== 1 || suspects[0] !== w.A || !E.validateBoard(w, cs, w.A, a, b, e).ok)
                continue;
            if (!g.closeBoard(w.A, a, b, e).ok || !navigate(w.A, true) || !resource(4))
                continue;
            g.confront(w.A);
            if (g.over || !dialog)
                continue;
            dialog.options.find(o => o.label === L("game.present_the_contradiction_1823"))?.fn();
            const answer = dialog?.options.find(o => o.label.includes(g.contradictionLine(a, b, w.A)) && o.label.includes(g.evidenceLine(e)));
            if (!answer)
                continue;
            answer.fn();
            if (g.hp <= 0 || g.san < 10 || g.en < 0 || g.min + 2 >= Math.max(...Object.values(w.blackout)))
                continue;
            dialog?.options.find(o => o.label === L("game.continue_1824"))?.fn();
            if (!result?.win)
                continue;
            return { order: steps, moves, t: Math.round(g.min * 100) / 100, hp: g.hp, san: Math.round(g.san * 10) / 10, en: g.en, cig: g.cig, monster: g.monster, pair: board.pair, evidence: board.evidence };
        }
        return null;
    }
    const GameAPI = { Game, templateVoice, nm, verifyPlayable, VOICES, SocialEngine, parseSocial, safeReaction, safeEpilogue, REACTION_AVOID, localIds, localApproach, parseLu, parseAmbient, luPlans, publicSnapshot, publicLabel, AMBIENT_TOPICS, StrategyEngine, TACTICS, RELATIONS };
    if (typeof module !== 'undefined' && module.exports)
        module.exports = GameAPI;
    else
        root.GameAPI = GameAPI;
})(typeof window !== 'undefined' ? window : globalThis);

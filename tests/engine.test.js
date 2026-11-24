/* Run with GAME_LANGUAGE=pt-BR or GAME_LANGUAGE=en. No network or browser required. */
const assert = require('node:assert/strict');
const E = require('../src/engine');
const G = require('../src/game');
const { language } = require('../src/localization');
const ui = { log(){}, update(){}, dialog(){}, closeDialog(){}, end(){} };
const worlds = [];
for (const mode of ['mvp','advanced']) {
  for (let seed = 0; seed < 60; seed++) {
    const w = new G.Game(ui).start(seed, mode);
    E.checkInvariants(w);
    assert.ok(w.proof && w.boardSolution);
    assert.equal(E.suspects(E.actionList(w).flatMap(a=>a.cards),w)[0],w.A);
    // Text translations must not change the underlying world or verified solution.
    worlds.push({mode,seed:w.seed,caseId:w.scenario.id,killer:w.A,scene:w.S,crimeBlock:w.cb,positions:w.pos,blackout:w.blackout,rain:w.rain,fragment:w.fragNode,claims:w.claims,proof:w.proof});
  }
  for (const c of E.CASES) assert.equal(new G.Game(ui).start(123, mode, null, c.id, c).scenario.id,c.id);
}
const english = language === 'en';
assert.equal(G.localApproach(english?'Please, could you help?':'Por favor, pode me ajudar?'),'respect');
assert.equal(G.localApproach(english?'I understand your concern':'Entendo sua preocupação'),'empathy');
const w=E.generate(42), x=E.NPCS[0], claims=w.testimony[x].self;
assert.ok(G.localIds(x,english?'Where were you?':'Onde você estava?',claims).length);
const safe=english?'I appreciate your patience.':'Agradeço a paciência.';
const response={speech:safe,ids:[],approach:'neutral',tactic:'cooperate',target:null};
assert.ok(G.parseSocial(JSON.stringify(response),x,claims,w.scenario));
assert.equal(G.parseSocial(JSON.stringify({...response,ids:['not-authorized']}),x,claims,w.scenario),null);
assert.equal(G.parseSocial(JSON.stringify({...response,speech:english?'I saw the killer.':'Vi o assassino.'}),x,claims,w.scenario),null);
assert.ok(G.parseLu(JSON.stringify({speech:safe,plans:['p0']}),[{id:'p0'}],w.scenario));
assert.ok(G.parseAmbient(JSON.stringify({lines:[safe,safe],id:null,relationship:'neutral'}),['bento','fiscal'],[],w.scenario));
const generated = english ? {title:'The Hidden Ledger',victim:'Nestor',occupation:'a musician',scheme:'fraud in a charity fund',sound:'a muffled cry',objects:['a torn envelope','a broken pendant','a damaged notebook'],secrets:['owed a small debt','hid an old receipt','borrowed a guitar','sold a damaged watch','argued over a payment'],lu:['He played beautifully.','He seemed worried.','I kept his letter.'],motive:'prevent the disclosure of the fraud'} : {title:'O livro escondido',victim:'Nestor',occupation:'músico',scheme:'fraude em um fundo beneficente',sound:'um grito abafado',objects:['um envelope rasgado','um pingente quebrado','um caderno danificado'],secrets:['devia uma pequena dívida','escondi um recibo antigo','peguei um violão emprestado','vendi um relógio danificado','discuti por um pagamento'],lu:['Ele tocava lindamente.','Ele parecia preocupado.','Guardei uma carta dele.'],motive:'impedir a divulgação da fraude'};
const c=E.parseCase(generated);for (const mode of ['mvp','advanced']) assert.ok(new G.Game(ui).start(123,mode,null,c.id,c).proof);
console.log(JSON.stringify(worlds));

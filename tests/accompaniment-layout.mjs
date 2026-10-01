import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const {chromium}=createRequire(process.env.PLAYWRIGHT_PACKAGE||'C:/Users/kenro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();await page.goto(process.env.TEST_URL||'http://127.0.0.1:8780/');
 const result=await page.evaluate(async()=>{
  const {accompanimentPolicy,configureAccompanimentLayout,installAccompanimentLayout}=await import('./accompaniment-layout.js');
  const rest='<note><rest/><duration>4</duration></note>',pitch='<note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note>';
  const score=content=>`<score-partwise><part-list><score-part id="P1"><part-name>Voice</part-name></score-part><score-part id="P2"><part-name>Piano</part-name></score-part></part-list><part id="P1"><measure>${rest}</measure></part><part id="P2">${content}</part></score-partwise>`;
  const items=[rest,pitch,rest.replace('</note>','<lyric><text>Word</text></lyric></note>'),rest+'<direction><direction-type><dynamics><p/></dynamics></direction-type><staff>1</staff></direction>',rest+'<direction><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>80</per-minute></metronome></direction-type></direction>',rest.replace('</note>','<notations><fermata/></notations></note>'),rest+'<harmony><root><root-step>C</root-step></root></harmony>',rest+'<barline><ending number="1" type="start"/></barline>'];
  const guards=items.map(item=>accompanimentPolicy(score(`<measure>${item}</measure>`))[1].meaningful[0]);
  const xml=score(`<measure><attributes><clef><sign>F</sign><line>4</line></clef><time><beats>4</beats><beat-type>4</beat-type></time><key><fifths>0</fifths></key></attributes>${rest}</measure><measure>${pitch}</measure>`),policy=accompanimentPolicy(xml);
  const span=accompanimentPolicy(score(`<measure>${rest}<direction><direction-type><pedal type="start"/></direction-type></direction></measure><measure>${rest}</measure><measure>${rest}<direction><direction-type><pedal type="stop"/></direction-type></direction></measure>`))[1].meaningful;
  class Builder{optimizeDistanceBetweenStaffLines(){this.called=true;}}installAccompanimentLayout({MusicSystemBuilder:Builder});
  const rules={},source=[{},{}],builder=new Builder();builder.rules=rules;builder.graphicalMusicSheet={ParentMusicSheet:{SourceMeasures:source}};configureAccompanimentLayout({EngravingRules:rules},xml);
  function render(index){const lines=[0,1].map(id=>({ParentStaff:{idInMusicSheet:id},Measures:[{parentSourceMeasure:source[index],staffEntries:[]}],PositionAndShape:{RelativePosition:{y:id*10}}}));const system={StaffLines:lines,GraphicalMeasures:[lines.map(l=>l.Measures[0])],PositionAndShape:{ChildElements:lines.map(l=>l.PositionAndShape)}};builder.optimizeDistanceBetweenStaffLines(system);return system.StaffLines.map(l=>l.ParentStaff.idInMusicSheet);}
  const hidden=render(0),returned=render(1);rules.musicTransposeLead=true;const melody=render(0);builder.rules={};const print=render(0);
  return {guards,span,policy,hidden,returned,melody,print,called:builder.called,sourceCount:source.length};
 });
 assert.deepEqual(result.guards,[false,true,true,true,true,true,true,true]);assert.deepEqual(result.span,[true,true,true]);assert.equal(result.policy[0].eligible,false);assert.deepEqual(result.policy[1].meaningful,[false,true]);assert.deepEqual(result.hidden,[0]);assert.deepEqual(result.returned,[0,1]);assert.deepEqual(result.melody,[0,1]);assert.deepEqual(result.print,[0,1]);assert(result.called);assert.equal(result.sourceCount,2);console.log('PASS: primary staff, rests, returning notes, lyrics, dynamics, tempo, notations, harmony, repeats/endings, spanning pedal, Melody and print isolation');
}finally{await browser.close();}

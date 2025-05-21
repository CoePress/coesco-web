CREATE SEQUENCE IF NOT EXISTS equip_id START 0 INCREMENT 1 MINVALUE 0;

CREATE SEQUENCE IF NOT EXISTS advert_id START 0 INCREMENT 1 MINVALUE 0;

CREATE SEQUENCE IF NOT EXISTS optbom_id START 0 INCREMENT 1 MINVALUE 0;

CREATE SEQUENCE IF NOT EXISTS optgroup_id START 0 INCREMENT 1 MINVALUE 0;

CREATE SEQUENCE IF NOT EXISTS request_id START 0 INCREMENT 1 MINVALUE 0;

CREATE SEQUENCE IF NOT EXISTS link_id START 0 INCREMENT 1 MINVALUE 0;

CREATE SEQUENCE IF NOT EXISTS pkgid START 0 INCREMENT 1 MINVALUE 0;

CREATE TABLE IF NOT EXISTS coiltype (
  coildesc VARCHAR(30) DEFAULT '',
  coilid INTEGER DEFAULT '0',
  coilmult NUMERIC DEFAULT '0',
  sortorder VARCHAR(8) DEFAULT '',
  isarchived BOOLEAN DEFAULT 'no'
);

CREATE TABLE IF NOT EXISTS equcost (
  id INTEGER DEFAULT '0',
  model VARCHAR(255) DEFAULT '',
  cell_value NUMERIC DEFAULT '0',
  quote_value NUMERIC DEFAULT '0'
);

CREATE TABLE IF NOT EXISTS equgroupinfo (
  equgroup VARCHAR(255) DEFAULT '',
  groupdesc VARCHAR(50) DEFAULT '',
  desc1 VARCHAR(256) DEFAULT '',
  desc2 VARCHAR(256) DEFAULT '',
  imageloc VARCHAR(60) DEFAULT '',
  imagex INTEGER DEFAULT '1400',
  imagey INTEGER DEFAULT '800',
  equfamily VARCHAR(20) DEFAULT '',
  equiptype VARCHAR(50) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS equiplist (
  model VARCHAR(20) DEFAULT '',
  maxwidth INTEGER DEFAULT '0',
  maxthick NUMERIC DEFAULT '0',
  ratio VARCHAR(255) DEFAULT '',
  maxspeed INTEGER DEFAULT '0',
  accel INTEGER DEFAULT '0',
  price NUMERIC DEFAULT '0',
  description VARCHAR(75) DEFAULT '',
  stdcost NUMERIC DEFAULT '0',
  permrg NUMERIC DEFAULT '0',
  rolldiam NUMERIC DEFAULT '0',
  rollnum INTEGER DEFAULT '2',
  minthick NUMERIC DEFAULT '0',
  rolltype VARCHAR(255) DEFAULT '',
  looplength INTEGER DEFAULT '0',
  equgroup VARCHAR(255) DEFAULT '',
  coilod NUMERIC DEFAULT '0',
  coilweight NUMERIC DEFAULT '0',
  createdate DATE DEFAULT CURRENT_DATE,
  createinit VARCHAR(3) DEFAULT '',
  modifydate DATE,
  modifyinit VARCHAR(255) DEFAULT '',
  prevmoddate DATE,
  prevmodinit VARCHAR(3) DEFAULT '',
  airdiam NUMERIC DEFAULT '0',
  pinchdiam NUMERIC DEFAULT '0',
  stroke INTEGER DEFAULT '0',
  spm INTEGER DEFAULT '0',
  comm NUMERIC DEFAULT '0',
  quotemode VARCHAR(8) DEFAULT '',
  plusratio VARCHAR(8) DEFAULT '',
  plusmaxspeed INTEGER DEFAULT '0',
  equiptype VARCHAR(50) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS equipopt (
  id INTEGER DEFAULT '0',
  model VARCHAR(255) DEFAULT '',
  price NUMERIC DEFAULT '0',
  createdate DATE DEFAULT CURRENT_DATE,
  createinit VARCHAR(3) DEFAULT '',
  modifydate DATE,
  modifyinit VARCHAR(255) DEFAULT '',
  prevmoddate DATE,
  prevmodinit VARCHAR(3) DEFAULT '',
  quotemode VARCHAR(8) DEFAULT '',
  hideoption BOOLEAN DEFAULT 'no',
  flags VARCHAR(60) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS equtobom (
  id INTEGER DEFAULT '0',
  model VARCHAR(255) DEFAULT '',
  bomid INTEGER DEFAULT '0',
  impacttype VARCHAR(255) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS idchangelog (
  id INTEGER DEFAULT '0',
  idtype VARCHAR(32) DEFAULT '',
  model VARCHAR(20) DEFAULT '',
  changetype VARCHAR(20) DEFAULT '',
  tablename VARCHAR(32) DEFAULT '',
  fieldchanged VARCHAR(32) DEFAULT '',
  beforevalue VARCHAR(60) DEFAULT '',
  aftervalue VARCHAR(32) DEFAULT '',
  transdttm TEXT,
  modinit VARCHAR(3) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS itemtojob (
  item VARCHAR(14) DEFAULT '',
  jobnumber INTEGER DEFAULT '0',
  jobsuffix VARCHAR(255) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS jobopts (
  jobnumber INTEGER DEFAULT '0',
  jobsuffix VARCHAR(255) DEFAULT '',
  id INTEGER DEFAULT '0',
  isstd BOOLEAN DEFAULT 'no',
  price NUMERIC DEFAULT '0',
  stat VARCHAR(255) DEFAULT '',
  model VARCHAR(20) DEFAULT '',
  eqposition INTEGER DEFAULT '0',
  hideoption BOOLEAN DEFAULT 'no'
);

CREATE TABLE IF NOT EXISTS jobspecials (
  jobnumber INTEGER DEFAULT '0',
  jobsuffix VARCHAR(255) DEFAULT '',
  name VARCHAR(100) DEFAULT '',
  descr VARCHAR(255) DEFAULT '',
  price NUMERIC DEFAULT '0',
  eqposition INTEGER DEFAULT '0',
  isstd BOOLEAN DEFAULT 'no',
  stat VARCHAR(255) DEFAULT '',
  model VARCHAR(20) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS jobtoquote (
  jobnumber INTEGER DEFAULT '0',
  qyear INTEGER DEFAULT '0',
  qnum INTEGER DEFAULT '0',
  qrev VARCHAR(255) DEFAULT '',
  jobsuffix VARCHAR(255) DEFAULT '',
  model VARCHAR(50) DEFAULT '',
  estprice NUMERIC DEFAULT '0',
  baseprice NUMERIC DEFAULT '0',
  origprice NUMERIC DEFAULT '0',
  disc_promo NUMERIC DEFAULT '0',
  stat VARCHAR(255) DEFAULT '',
  coiltype INTEGER DEFAULT '0',
  ismaxthick BOOLEAN DEFAULT 'yes',
  thickness NUMERIC DEFAULT '0',
  width NUMERIC DEFAULT '0',
  payoff NUMERIC DEFAULT '0',
  yield VARCHAR(20) DEFAULT '',
  sfx INTEGER DEFAULT '0',
  tensile VARCHAR(20) DEFAULT '',
  showtensile BOOLEAN DEFAULT 'no'
);

CREATE TABLE IF NOT EXISTS leadtime (
  model VARCHAR(20) DEFAULT '',
  lead INTEGER DEFAULT '0'
);

CREATE TABLE IF NOT EXISTS modeltojob (
  model VARCHAR(20) DEFAULT '',
  jobnumber INTEGER DEFAULT '0',
  jobsuffix VARCHAR(255) DEFAULT '',
  bomtype VARCHAR(255) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS notes (
  notetype VARCHAR(255) DEFAULT '',
  noteindex VARCHAR(255) DEFAULT '',
  notetime INTEGER DEFAULT '0',
  notedate DATE,
  notesubject VARCHAR(255) DEFAULT '',
  notebody VARCHAR(255) DEFAULT '',
  notecreater INTEGER DEFAULT '0',
  notealert BOOLEAN DEFAULT 'no',
  createdate DATE DEFAULT CURRENT_DATE,
  createinit VARCHAR(3) DEFAULT '',
  modifydate DATE,
  modifyinit VARCHAR(255) DEFAULT '',
  prevmoddate DATE,
  prevmodinit VARCHAR(3) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS optbom (
  bomid INTEGER DEFAULT '0',
  description VARCHAR(255) DEFAULT '',
  jobnumber INTEGER DEFAULT '0',
  jobsuffix VARCHAR(255) DEFAULT '',
  bomitem VARCHAR(255) DEFAULT '',
  linenumber VARCHAR(255) DEFAULT '',
  compitem VARCHAR(14) DEFAULT '',
  cell_value NUMERIC DEFAULT '0',
  quote_value NUMERIC DEFAULT '0',
  stdupdated DATE,
  qtupdated DATE
);

CREATE TABLE IF NOT EXISTS optgroup (
  grpid INTEGER DEFAULT '0',
  grpname VARCHAR(100) DEFAULT '',
  grpdescription VARCHAR(1300) DEFAULT '',
  grporder INTEGER DEFAULT '0',
  mandatory VARCHAR(255) DEFAULT '',
  multiple VARCHAR(255) DEFAULT '',
  flags VARCHAR(60) DEFAULT '',
  createdttm TEXT DEFAULT 'NOW',
  createinit VARCHAR(3) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS optgrp (
  id INTEGER DEFAULT '0',
  model VARCHAR(20) DEFAULT '',
  grpid INTEGER DEFAULT '0',
  createdttm TEXT DEFAULT 'NOW',
  createinit VARCHAR(3) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS opthelp (
  helpid INTEGER DEFAULT '0',
  id INTEGER DEFAULT '0',
  notes VARCHAR(500) DEFAULT '',
  createdttm TEXT,
  createinit VARCHAR(3) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS optlink (
  linkid INTEGER DEFAULT '0',
  id INTEGER DEFAULT '0',
  descid INTEGER DEFAULT '0',
  comment VARCHAR(255) DEFAULT '',
  condition VARCHAR(255) DEFAULT '',
  apprstat VARCHAR(8) DEFAULT '',
  apprinit VARCHAR(8) DEFAULT '',
  apprdttm TEXT,
  createdttm TEXT DEFAULT 'NOW',
  createinit VARCHAR(8) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS optpic (
  picid INTEGER DEFAULT '0',
  description VARCHAR(60) DEFAULT '',
  filename VARCHAR(255) DEFAULT '',
  xpos VARCHAR(15) DEFAULT '',
  ypos VARCHAR(15) DEFAULT '',
  width VARCHAR(15) DEFAULT '',
  height VARCHAR(15) DEFAULT '',
  createdate DATE DEFAULT CURRENT_DATE,
  createinit VARCHAR(3) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS otherequ (
  qyear INTEGER DEFAULT '0',
  qnum INTEGER DEFAULT '0',
  qrev VARCHAR(255) DEFAULT '',
  createdate DATE DEFAULT CURRENT_DATE,
  eqname VARCHAR(50) DEFAULT '',
  createinit VARCHAR(3) DEFAULT '',
  eqdesc VARCHAR(255) DEFAULT '',
  model VARCHAR(20) DEFAULT '',
  eqprice NUMERIC DEFAULT '0',
  modifydate DATE,
  modifyinit VARCHAR(255) DEFAULT '',
  prevmoddate DATE,
  prevmodinit VARCHAR(3) DEFAULT '',
  sfx INTEGER DEFAULT '0'
);

CREATE TABLE IF NOT EXISTS photo_lib (
  equgroup VARCHAR(255) DEFAULT '',
  description VARCHAR(255) DEFAULT '',
  filename VARCHAR(255) DEFAULT '',
  reltpath VARCHAR(255) DEFAULT '',
  createdate DATE DEFAULT CURRENT_DATE,
  modifydate DATE DEFAULT CURRENT_DATE,
  createinit VARCHAR(255) DEFAULT '',
  modifyinit VARCHAR(255) DEFAULT '',
  photostatus VARCHAR(255) DEFAULT '',
  xpos VARCHAR(15) DEFAULT '',
  ypos VARCHAR(15) DEFAULT '',
  width VARCHAR(15) DEFAULT '',
  height VARCHAR(15) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS photo_xref (
  filename VARCHAR(255) DEFAULT '',
  model VARCHAR(255) DEFAULT '',
  createdate DATE DEFAULT CURRENT_DATE,
  modifydate DATE DEFAULT CURRENT_DATE,
  createinit VARCHAR(255) DEFAULT '',
  modifyinit VARCHAR(255) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS pkgdef (
  pkgid INTEGER DEFAULT '0',
  pkgname VARCHAR(100) DEFAULT '',
  pkgdesc VARCHAR(2000) DEFAULT '',
  sortorder INTEGER DEFAULT '0',
  createdttm TEXT DEFAULT 'NOW',
  createinit VARCHAR(3) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS pkgmodel (
  pkgid INTEGER DEFAULT '0',
  modelgroup VARCHAR(255) DEFAULT '',
  model VARCHAR(20) DEFAULT '',
  requirement VARCHAR(255) DEFAULT '',
  pkgmodelid INTEGER DEFAULT '0',
  createdttm TEXT DEFAULT 'NOW',
  createinit VARCHAR(3) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS pkgopt (
  pkgoptid INTEGER DEFAULT '0',
  pkgid INTEGER DEFAULT '0',
  stage INTEGER DEFAULT '0',
  id INTEGER DEFAULT '0',
  createdttm TEXT DEFAULT 'NOW',
  createinit VARCHAR(3) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS printquote (
  qyear INTEGER DEFAULT '0',
  qnum INTEGER DEFAULT '0',
  qrev VARCHAR(255) DEFAULT '',
  cvrltr VARCHAR(255) DEFAULT '',
  xterms VARCHAR(100) DEFAULT '',
  delivery VARCHAR(50) DEFAULT '14-16 weeks',
  valid INTEGER DEFAULT '30',
  isline BOOLEAN DEFAULT 'no',
  billtodeal BOOLEAN DEFAULT 'no',
  incdeal BOOLEAN DEFAULT 'yes',
  comments VARCHAR(255) DEFAULT '',
  quotetocust BOOLEAN DEFAULT 'yes',
  xinc_train BOOLEAN DEFAULT 'no',
  createdate DATE DEFAULT CURRENT_DATE,
  createinit VARCHAR(3) DEFAULT '',
  modifydate DATE,
  modifyinit VARCHAR(255) DEFAULT '',
  prevmoddate DATE,
  prevmodinit VARCHAR(3) DEFAULT '',
  shipserv VARCHAR(50) DEFAULT '',
  shipcost NUMERIC DEFAULT '0',
  budgetary VARCHAR(255) DEFAULT '',
  installletterid VARCHAR(255) DEFAULT '',
  installscope VARCHAR(5000) DEFAULT '',
  estdeldate1 DATE,
  estdeldate2 DATE,
  estdelivery VARCHAR(50) DEFAULT '',
  fob VARCHAR(50) DEFAULT '',
  freight VARCHAR(25) DEFAULT '',
  warrantytype VARCHAR(20) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS psmodel (
  psmodel VARCHAR(30) DEFAULT '',
  model VARCHAR(30) DEFAULT '',
  optionlist VARCHAR(60) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS qdata (
  qyear INTEGER DEFAULT '0',
  qnum INTEGER DEFAULT '0',
  coersm INTEGER DEFAULT '0',
  c_company INTEGER DEFAULT '0',
  c_contact INTEGER DEFAULT '0',
  d_company INTEGER DEFAULT '0',
  d_contact INTEGER DEFAULT '0',
  canceled BOOLEAN DEFAULT 'no',
  shipped BOOLEAN DEFAULT 'no',
  priority VARCHAR(255) DEFAULT 'C',
  orderdate DATE,
  createdate DATE DEFAULT CURRENT_DATE,
  createinit VARCHAR(3) DEFAULT '',
  modifydate DATE,
  modifyinit VARCHAR(255) DEFAULT '',
  prevmoddate DATE,
  prevmodinit VARCHAR(3) DEFAULT '',
  photoname VARCHAR(255) DEFAULT '',
  division INTEGER DEFAULT '0',
  losttocomp BOOLEAN DEFAULT 'no',
  c_address INTEGER DEFAULT '0',
  d_address INTEGER DEFAULT '0',
  confidence INTEGER DEFAULT '0',
  estpodate DATE,
  producedby VARCHAR(50) DEFAULT '',
  lead_source VARCHAR(50) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS qoptcostsheet (
  costestimate NUMERIC DEFAULT '0',
  createdate DATE DEFAULT CURRENT_DATE,
  createinit VARCHAR(3) DEFAULT '',
  description VARCHAR(3000) DEFAULT '',
  hidelineprice BOOLEAN DEFAULT 'no',
  lineitem VARCHAR(255) DEFAULT '',
  lineorder INTEGER DEFAULT '0',
  linetype VARCHAR(8) DEFAULT '',
  modifydate DATE,
  modifyinit VARCHAR(255) DEFAULT '',
  prevmoddate DATE,
  prevmodinit VARCHAR(3) DEFAULT '',
  pricetext VARCHAR(255) DEFAULT '',
  qnum INTEGER DEFAULT '0',
  qrev VARCHAR(255) DEFAULT '',
  quantity INTEGER DEFAULT '0',
  qyear INTEGER DEFAULT '0',
  salesprice NUMERIC DEFAULT '0',
  showonquote BOOLEAN DEFAULT 'no'
);

CREATE TABLE IF NOT EXISTS qopts (
  qyear INTEGER DEFAULT '0',
  qnum INTEGER DEFAULT '0',
  qrev VARCHAR(255) DEFAULT '',
  xmodel VARCHAR(20) DEFAULT '',
  id INTEGER DEFAULT '0',
  isstd BOOLEAN default 'no',
  price NUMERIC DEFAULT '0',
  sfx INTEGER DEFAULT '0',
  eqposition INTEGER DEFAULT '0',
  hideoption BOOLEAN DEFAULT 'no',
  picid INTEGER DEFAULT '0'
);

CREATE TABLE IF NOT EXISTS qrev (
  qyear INTEGER DEFAULT '0',
  qnum INTEGER DEFAULT '0',
  qrev VARCHAR(255) DEFAULT '',
  model VARCHAR(20) DEFAULT '',
  qdate DATE DEFAULT CURRENT_DATE,
  estamt NUMERIC DEFAULT '0',
  disc_promo NUMERIC DEFAULT '0',
  options VARCHAR(75) DEFAULT '',
  estship DATE,
  estprice NUMERIC DEFAULT '0',
  baseprice NUMERIC DEFAULT '0',
  equ_notes VARCHAR(256) DEFAULT '',
  createdate DATE DEFAULT CURRENT_DATE,
  lead INTEGER DEFAULT '0',
  origprice NUMERIC DEFAULT '0',
  createinit VARCHAR(3) DEFAULT '',
  modifydate DATE,
  modifyinit VARCHAR(255) DEFAULT '',
  prevmoddate DATE,
  prevmodinit VARCHAR(3) DEFAULT '',
  thickness NUMERIC DEFAULT '0',
  width NUMERIC DEFAULT '0',
  coiltype INTEGER DEFAULT '0',
  ismaxthick BOOLEAN DEFAULT 'yes',
  sfx INTEGER DEFAULT '0',
  photoname VARCHAR(255) DEFAULT '',
  payoff NUMERIC DEFAULT '0',
  yield VARCHAR(20) DEFAULT '',
  optionalstatus VARCHAR(12) DEFAULT '',
  tensile VARCHAR(20) DEFAULT '',
  showtensile BOOLEAN DEFAULT 'no'
);

CREATE TABLE IF NOT EXISTS qrevcostsheet (
  qyear INTEGER DEFAULT '0',
  qnum INTEGER DEFAULT '0',
  qrev VARCHAR(255) DEFAULT '',
  lineorder INTEGER DEFAULT '0',
  linetype VARCHAR(8) DEFAULT '',
  description VARCHAR(3000) DEFAULT '',
  quantity INTEGER DEFAULT '0',
  salesprice NUMERIC DEFAULT '0',
  costestimate NUMERIC DEFAULT '0',
  hidelineprice BOOLEAN DEFAULT 'no',
  showonquote BOOLEAN DEFAULT 'no',
  lineitem VARCHAR(255) DEFAULT '',
  pricetext VARCHAR(255) DEFAULT '',
  createdate DATE DEFAULT CURRENT_DATE,
  createinit VARCHAR(3) DEFAULT '',
  modifydate DATE,
  modifyinit VARCHAR(255) DEFAULT '',
  prevmoddate DATE,
  prevmodinit VARCHAR(3) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS qrevinstlist (
  qyear INTEGER DEFAULT '0',
  qnum INTEGER DEFAULT '0',
  qrev VARCHAR(255) DEFAULT '',
  sfx INTEGER DEFAULT '0',
  id INTEGER DEFAULT '0',
  custinst BOOLEAN DEFAULT 'no',
  mfginst BOOLEAN DEFAULT 'no',
  thirdinst BOOLEAN DEFAULT 'no',
  eqpos INTEGER DEFAULT '0'
);

CREATE TABLE IF NOT EXISTS qspecs (
  qyear INTEGER DEFAULT '0',
  qnum INTEGER DEFAULT '0',
  qrev VARCHAR(255) DEFAULT '',
  coiltype INTEGER DEFAULT '0',
  minthick NUMERIC DEFAULT '0',
  maxthick NUMERIC DEFAULT '0',
  minwidth NUMERIC DEFAULT '0',
  maxwidth NUMERIC DEFAULT '0',
  length NUMERIC DEFAULT '0',
  payoff NUMERIC DEFAULT '0',
  coilod NUMERIC DEFAULT '18',
  xnest NUMERIC DEFAULT '0',
  xpinch NUMERIC DEFAULT '0',
  xlineprice NUMERIC DEFAULT '0',
  jobdisc NUMERIC DEFAULT '0',
  fullthick NUMERIC DEFAULT '0',
  fullwidth NUMERIC DEFAULT '0',
  xinc_train BOOLEAN DEFAULT 'no',
  xtrain NUMERIC DEFAULT '0'
);

CREATE TABLE IF NOT EXISTS qtnotes (
  qyear INTEGER DEFAULT '0',
  qnum INTEGER DEFAULT '0',
  qrev VARCHAR(255) DEFAULT '',
  coersm INTEGER DEFAULT '0',
  notedate DATE DEFAULT CURRENT_DATE,
  notetime INTEGER DEFAULT '0',
  note VARCHAR(256) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS qtterms (
  qyear INTEGER DEFAULT '0',
  dueorder INTEGER DEFAULT '0',
  percent INTEGER DEFAULT '0',
  event INTEGER DEFAULT '0',
  netdays INTEGER DEFAULT '0',
  verbage VARCHAR(100) DEFAULT '',
  amount NUMERIC DEFAULT '0',
  invoicetype VARCHAR(255) DEFAULT '',
  datereference INTEGER DEFAULT '0',
  qnum INTEGER DEFAULT '0',
  qrev VARCHAR(255) DEFAULT '',
  dateoffset INTEGER DEFAULT '0',
  customterms VARCHAR(255) DEFAULT '',
  nottoexceed INTEGER DEFAULT '0'
);

CREATE TABLE IF NOT EXISTS refquoteinfo (
  qyear INTEGER DEFAULT '0',
  qnum INTEGER DEFAULT '0',
  qrev VARCHAR(255) DEFAULT '',
  sfx INTEGER DEFAULT '0',
  refjobnumber INTEGER DEFAULT '0',
  refjobsuffix VARCHAR(255) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS rollparms (
  qyear INTEGER DEFAULT '0',
  qnum INTEGER DEFAULT '0',
  qrev VARCHAR(255) DEFAULT '',
  num INTEGER DEFAULT '2',
  diam NUMERIC DEFAULT '0',
  width INTEGER DEFAULT '0',
  acceleration INTEGER DEFAULT '0',
  maxspeed INTEGER DEFAULT '0',
  length2 INTEGER DEFAULT '0',
  a180 INTEGER DEFAULT '0',
  a240 INTEGER DEFAULT '0',
  ratio VARCHAR(255) DEFAULT '',
  length NUMERIC DEFAULT '0',
  xmodel VARCHAR(20) DEFAULT '',
  parmtitles INTEGER DEFAULT '0',
  sfx INTEGER DEFAULT '0',
  pressbedlength NUMERIC DEFAULT '0',
  tabletitles VARCHAR(25) DEFAULT '',
  feedlength NUMERIC DEFAULT '0',
  spm1 INTEGER DEFAULT '0',
  fpm1 INTEGER DEFAULT '0',
  spm2 INTEGER DEFAULT '0',
  fpm2 INTEGER DEFAULT '0'
);

CREATE TABLE IF NOT EXISTS specials (
  qyear INTEGER DEFAULT '0',
  qnum INTEGER DEFAULT '0',
  qrev VARCHAR(255) DEFAULT '',
  xmodel VARCHAR(20) DEFAULT '',
  name VARCHAR(100) DEFAULT '',
  descr VARCHAR(255) DEFAULT '',
  eqposition INTEGER DEFAULT '0',
  price NUMERIC DEFAULT '0',
  isstd BOOLEAN default 'no',
  sfx INTEGER DEFAULT '0',
  picid INTEGER DEFAULT '0'
);

CREATE TABLE IF NOT EXISTS startup (
  qyear INTEGER DEFAULT '0',
  qnum INTEGER DEFAULT '0',
  qrev VARCHAR(255) DEFAULT '',
  days INTEGER DEFAULT '0',
  techs INTEGER DEFAULT '0',
  type INTEGER DEFAULT '0',
  amount NUMERIC DEFAULT '0',
  notes VARCHAR(255) DEFAULT '',
  description VARCHAR(100) DEFAULT '',
  manpower VARCHAR(100) DEFAULT '',
  scope VARCHAR(1000) DEFAULT '',
  startupcompany VARCHAR(50) DEFAULT '',
  returnstatus VARCHAR(20) DEFAULT '',
  contact1 VARCHAR(30) DEFAULT '',
  phone1 VARCHAR(25) DEFAULT '',
  email1 VARCHAR(100) DEFAULT '',
  contact2 VARCHAR(30) DEFAULT '',
  phone2 VARCHAR(25) DEFAULT '',
  email2 VARCHAR(100) DEFAULT '',
  faxnumber VARCHAR(20) DEFAULT '',
  quotestatus VARCHAR(20) DEFAULT '',
  quotedby VARCHAR(3) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS stdequ (
  id INTEGER DEFAULT '0',
  model VARCHAR(255) DEFAULT '',
  createdate DATE DEFAULT CURRENT_DATE,
  createinit VARCHAR(3) DEFAULT '',
  modifydate DATE,
  modifyinit VARCHAR(255) DEFAULT '',
  prevmoddate DATE,
  prevmodinit VARCHAR(3) DEFAULT '',
  quotemode VARCHAR(8) DEFAULT '',
  hideoption BOOLEAN DEFAULT 'no'
);

CREATE TABLE IF NOT EXISTS stdequgroup (
  stdequgrpid INTEGER DEFAULT '0',
  grpname VARCHAR(100) DEFAULT '',
  grpdescription VARCHAR(1300) DEFAULT '',
  grptype VARCHAR(255) DEFAULT '',
  grporder INTEGER DEFAULT '0',
  createdttm TEXT,
  createinit VARCHAR(3) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS stdequip (
  id INTEGER DEFAULT '0',
  createdate DATE DEFAULT CURRENT_DATE,
  createinit VARCHAR(3) DEFAULT '',
  modifydate DATE,
  name VARCHAR(100) DEFAULT '',
  descr VARCHAR(255) DEFAULT '',
  eqposition INTEGER DEFAULT '0',
  modifyinit VARCHAR(255) DEFAULT '',
  prevmoddate DATE,
  prevmodinit VARCHAR(3) DEFAULT '',
  quotemode VARCHAR(8) DEFAULT '',
  application VARCHAR(255) DEFAULT '',
  picid INTEGER DEFAULT '0',
  optiongrpid INTEGER DEFAULT '0',
  hideoption BOOLEAN DEFAULT 'no',
  flags VARCHAR(60) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS stdequlink (
  stdequlinkid INTEGER DEFAULT '0',
  id INTEGER DEFAULT '0',
  refid INTEGER DEFAULT '0',
  relationship VARCHAR(20) DEFAULT '',
  createdttm TEXT DEFAULT 'NOW',
  createinit VARCHAR(3) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS stdexcluded (
  id INTEGER DEFAULT '0',
  qyear INTEGER DEFAULT '0',
  qnum INTEGER DEFAULT '0',
  qrev VARCHAR(255) DEFAULT '',
  sfx INTEGER DEFAULT '0',
  jobnumber INTEGER DEFAULT '0',
  jobsuffix VARCHAR(255) DEFAULT ''
);
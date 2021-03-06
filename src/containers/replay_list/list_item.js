import React, { Component } from "react";
import axios from "axios";
import ListPart from "./list_part";
import DoubleCell from "../../components/double_cell";
import Arc from "../../components/arc";
import { hashString } from "../../helpers/hasher";
import {
  formatNumber,
  formatDate,
  formatTime,
  formatLength,
} from "../../helpers/smallHelpers";
import PercentBar from "../../components/percent_bar";
import Replay from "../replay/replay";
import ProcessReplay from "../replay/process_replay";
import asleep from "../../helpers/asleep";
let ipcRenderer;
if (window.isElectron) ipcRenderer = window.require("electron").ipcRenderer;
const barColors = ["#8C5F8C", "#51A1A7", "#6383C4"];
const modes = {
  1: "QM",
  2: "UD",
  3: "HL",
  4: "TL",
  5: "BR",
  6: "SL",
};

let statBar = (statValue, index, statRange, statName) => {
  const percent = (statValue - statRange[0]) / statRange[1];
  const number = formatNumber(statValue).toString();
  const spaces = 5 - number.length;
  return (
    <div className={`miniStatBar ${percent}`} key={`${index}${statValue}`}>
      <PercentBar
        percent={Math.min(1, isNaN(percent) ? 0 : percent)}
        barColor={barColors[index]}
      />
      <div className="miniStatText" style={{ top: `${-22 + index * 3}px` }}>
        {`${statName}:`}
        {Array(spaces)
          .fill("\u00A0")
          .join("")}
        {`${formatNumber(statValue)}`}
      </div>
    </div>
  );
};
let talentIcon = (
  talentIcon,
  key,
  row,
  openPopup,
  messagePopup,
  talent,
  hero,
  div
) => {
  talentIcon = `${
    talentIcon || talentIcon === 0 ? `${talentIcon}.jpg` : "empty.png"
  }`;
  return (
    <div
      className="tinyTalentHolder"
      key={key}
      onMouseEnter={event => {
        if (!talent) {
          return;
        }
        const name = window.HOTS.cTalents[hero][talent][0];
        const desc = window.HOTS.cTalents[hero][talent][1];
        event.preventDefault();
        openPopup(
          row,
          div,
          name,
          desc,
          `https://heroes.report/singleTalents/${talentIcon}`,
          true
        );
      }}
      onMouseLeave={event => {
        if (!talent) {
          return;
        }
        event.preventDefault();
        messagePopup();
      }}
    >
      <img
        key={key}
        className="tinyTalent"
        src={`https://heroes.report/singleTalentsTiny/${talentIcon}`}
        alt={talentIcon}
      />
    </div>
  );
};

let tinyHero = (hero, key, openPopup, row, messagePopup, div, nHeroes) => {
  // sometimes data will be corrupt
  let imgSrc =
    hero >= nHeroes
      ? "https://heroes.report/singleTalents/empty.png"
      : `https://heroes.report/squareHeroes/${hero}.jpg`;
  return (
    <img key={key} className={`tinyHero ${hero}`} src={imgSrc} alt={hero} />
  );
};

let firsts = (first, text) => {
  return (
    <div
      className="firsts"
      style={{
        color: first === 1 ? "#00ff00" : first === 0 ? "#ff0000" : "#333",
      }}
    >
      {text}
    </div>
  );
};

let left = (props, div, getReplay) => {
  let {
    hero,
    coplayer,
    slot,
    id,
    mode,
    build,
    coplayerIsAlly,
    heroes,
    hasCoplayer,
  } = props;
  if (mode === 3) {
    if (build >= 73016) {
      mode = 6;
    }
  }
  return (
    <div
      className={`col-12 col-sm-6 col-xl-6 noPadding listPart`}
      align="center"
      onClick={() => getReplay(props)}
    >
      <div className="inner_list_item_left">
        {hasCoplayer && (
          <div className="coplayerHolder">
            <img
              className="tinyReplayHero"
              src={`https://heroes.report/squareHeroes/${heroes[coplayer]}.jpg`}
              alt={slot}
            />
            <Arc
              color={coplayerIsAlly ? "#00ff00" : "#ff0000"}
              fillOpacity={1}
              dim={28}
              translate="(10,13)"
              extraClass="coplayerArc"
            />
          </div>
        )}
        <img
          onMouseEnter={event => {
            const name = window.HOTS.nHeroes[hero];
            const desc = "";
            event.preventDefault();
            props.openPopup(
              props.row,
              div,
              name,
              desc,
              `https://heroes.report/squareHeroes/${hero}.jpg`
            );
          }}
          onMouseLeave={event => {
            event.preventDefault();
            props.messagePopup();
          }}
          className="tinyReplayHero"
          src={`https://heroes.report/squareHeroes/${hero}.jpg`}
          alt={slot}
        />
        <Arc
          color={"#0000ff"}
          id={id}
          dim={28}
          translate="(10,13)"
          extraClass="reportArc"
        />
        <img
          onMouseEnter={event => {
            const mapName = window.HOTS.nMaps[props.map];
            const pName = props.handle
              ? props.handle.split("#")[0]
              : "Still getting player info";
            const name = `${mapName} | ${props.won ? "Victory" : "Defeat"}`;
            const desc = `${pName} ${props.won ? "won" : "lost"} a${
              mode === 2 ? "n" : ""
            } ${window.HOTS.nModes[mode]}${
              mode === 1 || mode === 5 ? "" : " match"
            } on ${mapName} as ${
              window.HOTS.nHeroes[props.hero]
            } in ${formatLength(
              props.Length,
              true
            )} on ${props.date.toString().slice(0, 10)} at ${formatTime(
              props.date
            )}.`;
            event.preventDefault();
            props.openPopup(
              props.row,
              div,
              name,
              desc,
              `https://heroes.report/mapPosts/${props.map}.jpg`
            );
          }}
          onMouseLeave={event => {
            event.preventDefault();
            props.messagePopup();
          }}
          className="tinyReplayMap"
          src={`https://heroes.report/mapPostsTiny/${props.map}.png`}
          alt={props.map}
        />
        <span className="gameModeBox">{modes[mode === 3 ? 3 : mode]}</span>
        <DoubleCell
          topValue={formatDate(props.date)}
          bottomValue={formatTime(props.date)}
        />
        <span
          className="victoryBox"
          style={{ color: props.won ? "#00ff00" : "#ff0000" }}
        >
          {props.won ? "V" : "D"}
        </span>
        <span className="gameLength">{formatLength(props.Length)}</span>
        <div className="teamsHolder">
          <div className="tinyHeroHolder" style={{ background: "#022c02" }}>
            {[0, 1, 2, 3, 4].map(x =>
              tinyHero(
                props.allies[x],
                `${props.MSL}-${x}`,
                props.openPopup,
                props.row,
                props.messagePopup,
                div,
                props.nHeroes
              )
            )}
          </div>
          <div className="tinyHeroHolder" style={{ background: "#350101" }}>
            {[0, 1, 2, 3, 4].map(x =>
              tinyHero(
                props.enemies[x],
                `${props.MSL}-${x}`,
                props.openPopup,
                props.row,
                props.messagePopup,
                div,
                props.nHeroes
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

class replay extends Component {
  shouldComponentUpdate(nextProps) {
    if (
      this.props.handle !== nextProps.handle ||
      this.props.MSL !== nextProps.MSL ||
      (this.props.curMSL !== nextProps.curMSL &&
        nextProps.MSL !== nextProps.curMSL)
    ) {
      this.reloaded = true;
      this.setState({
        ...this.state,
        open: false,
        replay: null,
        replayData: null,
      });
    }
    return true;
  }
  constructor(props) {
    super(props);
    this.state = { open: false, replay: null, replayData: null, div: null };
    this.openReplay = this.openReplay.bind(this);
    this.getReplay = this.getReplay.bind(this);
  }
  openReplay(results) {
    this.setState({
      ...this.state,
      open: !this.state.open,
      replay: results,
    });
  }
  async getReplay(props) {
    if (this.props.isYou) {
      ipcRenderer.send("request:replay", this.props.MSL);
      ipcRenderer.once("send:replay", (e, replay) => {
        const replayData = ProcessReplay(replay, replay.bnetID);
        this.setState({ ...this.state, replay, replayData });
      });
      while (!this.state.replay) await asleep(50);
    }
    if (!this.state.replay) {
      const { MSL, heroes, winners, Length, mode, build, map } = props;
      window.rep = props;
      const hashInput = `${mode}${Math.round(Length / 60)}${heroes.join(
        ""
      )}${winners}${MSL}${map}${build}`;
      const hashPath = `https://heroes.report/stats/replays/${hashString(
        hashInput
      )}.json`;
      console.log(hashPath);
      const results = await axios.get(hashPath);
      let replay = results.data;
      if (replay.hasOwnProperty("replay")) {
        replay = replay.replay;
      }
      const replayData = ProcessReplay(replay, props.bnetID);
      this.setState({ ...this.state, replay, replayData });
    }
    this.props.changeOpenReplay(this.props.MSL);
    this.setState({ ...this.state, open: !this.state.open });
  }
  render() {
    const props = this.props;
    const { open, replay } = this.state;
    return (
      <div
        ref={div => {
          if (this.state.div) {
            return;
          }
          this.setState({ ...this.state, div: div });
        }}
        className="replayItem row"
      >
        {left(props, this.state.div, this.getReplay)}
        <div
          onClick={() => this.getReplay(props)}
          className={`col-12 col-sm-6 col-xl-6 noPadding listPart`}
          align="center"
        >
          <div className="inner_list_item_right">
            <div className="miniStatsHolder">
              {props.stats.map((x, i) =>
                statBar(props.statValues[i], i, props.ranges[i], x)
              )}
            </div>
            <div className="firstsHolder">
              {firsts(props.FirstTo10, "10")}
              {firsts(props.FirstTo20, "20")}
            </div>
            <div
              ref={div => {
                this.talentsDiv = div;
              }}
              className="talentsHolder"
            >
              {[0, 1, 2, 3, 4, 5, 6].map(x =>
                talentIcon(
                  props.talPics[x],
                  `${props.MSL}-${x}`,
                  props.row,
                  props.openPopup,
                  props.messagePopup,
                  props.talents[x],
                  props.hero,
                  this.state.div
                )
              )}
            </div>
            <i
              className="fa fa-lg fa-chevron-circle-down downloadReplay"
              aria-hidden="true"
            />
          </div>
        </div>
        {this.state.open && (
          <Replay
            thisDiv={this.talentsDiv}
            replay={replay}
            handle={this.props.handle}
            bnetID={this.props.bnetID}
            MSL={props.MSL}
            replayData={this.state.replayData}
          />
        )}
      </div>
    );
  }
}

export default replay;

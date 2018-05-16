import React, { Component } from 'react'
import FilterDropDown from '../containers/filter_drop_down'
import _ from 'lodash'
import ButtonLabeledSpacer from '../components/button_labeled_spacer'
import IconList from '../containers/icon_list'
import { modeChoices, modeDic, mmrChoices, mmrDic, timeDensityChoices } from '../helpers/definitions'
import SearchBar from '../components/search_bar'
import { renderTime, renderNothing, renderTinyMap, renderPeeps, renderTinyHero, renderTeam, renderPlayerData } from '../components/filterComponents'
import { connect } from 'react-redux'
import { updateTimeDensity, updateRustyStats, updateRustyGraphs, updateFullMode, updateFullMaps, updateFullRegions, updateDateRange, updatePreferences, getMainData, getHeroTalents, rollbackState, updateFilter, selectTalent, addHeroFilter, getTimedData, updateTime, heroSearch, coplayerSearch, selectCoplayer } from '../actions'
import UpdateStatCat from './update_stat_cat'
import TimeLine from './replay_list/timeline'
import PlayerReplaysSelector from '../selectors/player_replays_selector'
import DatePicker from 'react-datepicker'
import moment from 'moment'
import 'react-datepicker/dist/react-datepicker.css'
import getReplayBinary from '../helpers/binary_replay_unpacker'
window.moment = moment

const fetchedFullReplays = []

const roleDropdownData = ['Assassin','Warrior','Support','Specialist'].map(x => { return {name:x, id:x} })

class DataFilters extends Component {
  constructor(props) {
    super(props)
    this.updateMode = this.updateMode.bind(this)
    this.updateMMR = this.updateMMR.bind(this)
    this.updateTime = this.updateTime.bind(this)
    this.updateMap = this.updateMap.bind(this)
    this.updateAllies = this.updateAllies.bind(this)
    this.updateEnemies = this.updateEnemies.bind(this)
    this.updateSelf = this.updateSelf.bind(this)
    this.isMenu = this.isMenu.bind(this)
    this.getHeroes = this.getHeroes.bind(this)
    this.heroSearch = this.heroSearch.bind(this)
    this.playerSearch = this.playerSearch.bind(this)
    this.updateSelectedPlayer = this.updateSelectedPlayer.bind(this)
    this.updateStartDate= this.updateStartDate.bind(this)
    this.updateEndDate= this.updateEndDate.bind(this)
    this.updateFullMode = this.updateFullMode.bind(this)
    this.updateFullMaps = this.updateFullMaps.bind(this)
    this.updateFullRegions = this.updateFullRegions.bind(this)
    this.getFullData = this.getFullData.bind(this)
    this.filterData = this.filterData.bind(this)
    this.updateTimeDensity = this.updateTimeDensity.bind(this)
  }
  updateTimeDensity(timeDensity) {
    this.props.updateTimeDensity(timeDensity)
  }
  updateSelectedPlayer(data) {
    if (data === 'A' || data.bnetID==='All') {
      this.props.selectCoplayer(null)
      if (data === 'A') setTimeout(() => { window.$('#playerSearch').val("") }, 200)
    } else this.props.selectCoplayer(data)
  }
  getHeroes() {
    this.props.getHeroTalents(this.props.prefs.hero,this.props.prefs)
    this.props.getTimedData(this.props.prefs,this.props.prefs.hero)
    this.props.selectTalent('reset')
  }
  updateTime(newTime) {
    this.props.updatePreferences('time', newTime)
  }
  updateFullMaps(newMap) {
    this.props.updateFullMaps(newMap)
  }
  updateFullRegions(newRegion) {
    this.props.updateFullRegions(newRegion)
  }
  updateAllies(hero) {
    this.props.addHeroFilter(0, hero)
  }
  updateStartDate(newDate) {
    this.gotRusty = false
    this.props.updateDateRange("startDate",newDate)
  }
  updateEndDate(newDate) {
    this.gotRusty = false
    this.props.updateDateRange("endDate",newDate)
  }
  updateEnemies(hero) {
    this.props.addHeroFilter(1, hero)
  }
  updateSelf(hero) {
    this.props.addHeroFilter(2, hero)
  }
  updateMode(newMode) {
    this.props.updatePreferences('mode', newMode)
  }
  updateMMR(newMMR) {
    this.props.updatePreferences('mmr', newMMR)
  }
  updateMap(newMap) {
    this.props.updatePreferences('map', newMap)
  }
  updateFullMode(newMode) {
    this.gotRusty = false
    this.props.updateFullMode(newMode)
  }
  getFullData() {
    let promise = new Promise(async(resolve, reject) => {
      console.log('get full data called')
      if (this.isRusty) return
      this.isRusty = true
      this.gotRusty = true
      const { dates, fullModes } = this.props
      const modesToUse = fullModes.filter(x => x.isActive).map(x => x.id)
      const retrievedReplays = await getReplayBinary(dates,modesToUse)
      this.isRusty = undefined
      resolve(retrievedReplays)
    })
    return promise
  }
  async filterData() {
    if (this.isRusty) return
    if (!this.gotRusty) await this.getFullData()
    this.isRusty = true
    this.gotRusty = true
    let { stats, winrateData } = window.rustyReplays.filterData(this.props)
    this.props.updateRustyStats(stats)
    this.props.updateRustyGraphs(winrateData)
    this.isRusty = undefined
  }
  isMenu(bits) {
    // This uses bit switching to determine which menu parts to show for different screens
    // So the first screen (0) is the rightmost bit, etc.  Ignore eslint suggestion.
    return bits & (1<<this.props.menu) ? true : false
  }
  playerSearch(term) {
    if (!term) {
      this.props.coplayerSearch('All')
      this.updateSelectedPlayer({bnetID: 'All'})
    } else this.props.coplayerSearch(term)
  }
  heroSearch(term) {
    this.props.heroSearch(term)
  }

  render() {
    const heroSearch = _.debounce((term) => {
      this.heroSearch(term)
    }, 500)
    const playerSearch = _.debounce((term) => {
      this.playerSearch(term)
      if (term) {
        setTimeout(() => {
          if (window.$('#playerSearchDropdown').attr('aria-expanded') === 'false') {
            window.document.getElementById("playerSearchDropdown").click()
            window.document.getElementById('playerSearch').focus()
          }
        }, 200)
      }
    }, 500)
    const [allies, enemies, self] = this.props.filterHeroes
    const { startDate, endDate } = this.props.dates

    window.sortedMaps = this.props.HOTS.sortedMaps
    return (
      <div>
        <div className="row dataFilters">
          {this.isMenu(0b1000)&&<form className="input-group filterGroup  justify-content-center">
            <span className="dateText">Dates:</span>
            <DatePicker
              selected={startDate}
              onChange={(res) => { this.updateStartDate(res) }}
              minDate={moment().subtract(6, "month")}
              maxDate={moment(Math.min(moment(), endDate))}
            />
            <span className="dateText2">---</span>
            <DatePicker
              selected={this.props.dates.endDate}
              onChange={(res) => { this.updateEndDate(res) }}
              minDate={moment(Math.max(moment().subtract(6, "month"), startDate))}
              maxDate={moment()}
            />
          </form>}
          {this.isMenu(0b1000)&&<FilterDropDown
            currentSelection={""}
            name={`Game Modes: ${this.props.fullModes.filter(x => x.isActive).map(x => x.name.split(" ").map(x => x[0]).join("")).join("|")}`}
            id='gameMode'
            dropdowns={this.props.fullModes}
            updateFunction={(mode) => this.updateFullMode(mode)}
            leftComponentRenderer={renderNothing}
            rightComponentRenderer={renderNothing}
            renderDropdownName={true}
            currentID={1}
          />}
          {this.isMenu(0b1000) && <ButtonLabeledSpacer
            info="Load all replays that fit the filters to the left / above"
            filterName='Get Individual Replay Data'
            faIcon='fa-refresh'
            onPress={() => { this.getFullData() }}
          />}
          {this.isMenu(0b0101) && <FilterDropDown
            currentSelection=''
            name=''
            id='timeFrame'
            dropdowns={this.props.HOTS.times ? this.props.HOTS.times : [{name: '', 'id': '', selected: false}]}
            updateFunction={this.updateTime}
            leftComponentRenderer={renderTime}
            rightComponentRenderer={renderNothing}
            renderDropdownName={false}
            buttonLabel={window.builds ? window.builds[this.props.prefs.time].name : ''}
            currentID={this.props.prefs.time}
          />}
          {this.isMenu(0b1000)&&<FilterDropDown
            currentSelection={""}
            name={`Regions: ${this.props.fullRegions.filter(x => x.isActive).map(x => ["","US","EU","KR","","CN"][x.id]).join("|")}`}
            id='gameMode'
            dropdowns={this.props.fullRegions}
            updateFunction={(region) => this.updateFullRegions(region)}
            leftComponentRenderer={renderNothing}
            rightComponentRenderer={renderNothing}
            renderDropdownName={true}
            currentID={1}
          />}
          <FilterDropDown
            currentSelection={window.mapsDic ? (this.isMenu(0b1000) ? `Maps (${this.props.fullMaps.filter(x => x.isActive).length || 'All'})` : window.mapsDic[this.props.prefs.map].name) : ''}
            name=''
            id='gameMap'
            dropdowns={this.props.HOTS.sortedMaps ? (this.isMenu(0b1000) ? [{id: 'A', name: 'All Maps (reset)', isActive: false}, ...this.props.HOTS.sortedMaps.filter(x => x.id <30).map(x => { return { id: x.id, name: x.name, isActive: this.props.fullMaps[x.id].isActive } })] : this.props.HOTS.sortedMaps) : []}
            updateFunction={this.isMenu(0b1000) ? this.updateFullMaps : this.updateMap}
            leftComponentRenderer={this.isMenu(0b1000) ? renderNothing : renderTinyMap}
            rightComponentRenderer={renderNothing}
            renderDropdownName={true}
            currentID={window.mapsDic ? window.mapsDic[this.props.prefs.map].id : 99}
          />
          {this.isMenu(0b0101) && <FilterDropDown
            currentSelection=""
            name='MMR'
            id='mmr'
            dropdowns={mmrChoices}
            updateFunction={this.updateMMR}
            leftComponentRenderer={renderPeeps}
            rightComponentRenderer={renderNothing}
            renderDropdownName={true}
            currentID={ mmrDic[this.props.prefs.mmr].id }
          />}
          {this.isMenu(0b0111) && <FilterDropDown
            currentSelection={modeDic[this.props.prefs.mode].name}
            name='Game Mode: '
            id='gameMode'
            dropdowns={modeChoices}
            updateFunction={this.updateMode}
            leftComponentRenderer={renderNothing}
            rightComponentRenderer={renderNothing}
            renderDropdownName={true}
            currentID={modeDic[this.props.prefs.mode].id}
          />}
          {/* below I use getHeroTalents if menu is not 1 */}
          {this.isMenu(0b0101) && <ButtonLabeledSpacer
            info="Filter replay data with your selected filters"
            filterName='Update'
            faIcon='fa-refresh'
            onPress={() => { this.isMenu(0b0001) ? this.props.getMainData(this.props.prefs, this.props.rollbackState) : this.getHeroes(this.props.prefs.hero,this.props.prefs) }}
          />}
          {this.isMenu(0b0001) && <UpdateStatCat />}
          {this.isMenu(0b0010) && <FilterDropDown
            currentSelection=""
            resetFunction={this.updateSelf}
            buttonLabel={
              <div className="teamFilterHolder">
                <div className="leftTeamFilter">
                  <i className="fa fa-user-circle self" aria-hidden="true"></i>
                  <span className="filterLabel">Player</span>
                </div>
                {renderTeam(self)}
              </div>
            }
            name=''
            id='Self'
            dropdowns={this.props.HOTS.sortedHeroes ? [...this.props.HOTS.sortedHeroes] : []}
            updateFunction={this.updateSelf}
            leftComponentRenderer={renderTinyHero}
            rightComponentRenderer={renderNothing}
            renderDropdownName={true}
            currentID={99}
            containerClass='halfy input-group filterGroup'
            hideArrow={true}
          />}
          {this.isMenu(0b0011) && <SearchBar formClass={`${this.isMenu(0b0010) ? 'halfy' : ''} input-group filterGroup buttonSpacer blackButton`} placeholder="Hero search" overClass="btn btn-small btn-link iconFilter" onSearchTermChange={heroSearch} noautoclear={true} />}
          {this.isMenu(0b1010) && <FilterDropDown
            currentSelection=""
            resetFunction={this.updateAllies}
            buttonLabel={
              <div className="teamFilterHolder">
                <div className="leftTeamFilter">
                  <i className="fa fa-user-plus allies" aria-hidden="true"></i>
                  <span className="filterLabel">Allies</span>
                </div>
                {renderTeam(allies)}
              </div>
            }
            name=''
            id='Allies'
            dropdowns={this.props.HOTS.sortedHeroes ? [...roleDropdownData,...this.props.HOTS.sortedHeroes] : []}
            updateFunction={this.updateAllies}
            leftComponentRenderer={renderTinyHero}
            rightComponentRenderer={renderNothing}
            renderDropdownName={true}
            currentID={99}
            containerClass='halfy input-group filterGroup'
            hideArrow={true}
          />}
          {this.isMenu(0b1010) && <FilterDropDown
            currentSelection=""
            resetFunction={this.updateEnemies}
            buttonLabel={
              <div className="teamFilterHolder">
                <div className="leftTeamFilter">
                  <i className="fa fa-user-plus enemies" aria-hidden="true"></i>
                  <span className="filterLabel">Enemies</span>
                </div>
                {renderTeam(enemies)}
              </div>
            }
            name=''
            id='Enemies'
            dropdowns={this.props.HOTS.sortedHeroes ? [...roleDropdownData,...this.props.HOTS.sortedHeroes] : []}
            updateFunction={this.updateEnemies}
            leftComponentRenderer={renderTinyHero}
            rightComponentRenderer={renderNothing}
            renderDropdownName={true}
            currentID={99}
            containerClass='halfy input-group filterGroup'
            hideArrow={true}
          />}
          {this.isMenu(0b1000) && <FilterDropDown
            currentSelection={timeDensityChoices.filter(x => x.id === this.props.timeDensity)[0].name}
            name='Time Period: '
            id='timeDensity'
            dropdowns={timeDensityChoices}
            updateFunction={this.updateTimeDensity}
            leftComponentRenderer={renderNothing}
            rightComponentRenderer={renderNothing}
            renderDropdownName={true}
            currentID={this.props.timeDensity}
          />}
          {this.isMenu(0b1000) && <ButtonLabeledSpacer
            info="Filter loaded data"
            filterName='Filter Individual Replay Data'
            faIcon='fa-refresh'
            onPress={() => { this.filterData() }}
          />}
          {this.isMenu(0b0011) && <IconList info={"Choose roles and/or universes of heroes to filter by"} className='float-left' iconList={this.props.roles.concat(this.props.franchises)} updateFilter={this.props.updateFilter} />}
          {this.isMenu(0b0010) && window.location.pathname.includes("players/you") && <div>
            <FilterDropDown
              info={"Find a player you played against or with.  All other filters are ignored for this search for simplicity.  By default this displays the players you have had the most matches with, search for other players to the right."}
              resetFunction={this.updateSelectedPlayer}
              currentSelection='Coplayers'
              name=''
              id='playerSearchDropdown'
              dropdownClass='playerSearchDropdown'
              dropdowns={this.props.playerCoplayerResults}
              updateFunction={this.updateSelectedPlayer}
              leftComponentRenderer={renderNothing}
              rightComponentRenderer={renderPlayerData}
              renderDropdownName={true}
              currentID=' '
            />
            <SearchBar placeholder="Coplayer Search" id="playerSearch" overClass="btn btn-small btn-link iconFilter" onSearchTermChange={playerSearch} noautoclear={true} />
          </div>}
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  const { HOTS, timeDensity, prefs, status, roles, franchises, filterHeroes, timeRange, playerCoplayerResults, dates, fullModes, fullMaps, fullRegions } = state
  return { ...PlayerReplaysSelector(state), HOTS, timeDensity, prefs, status, roles, franchises, filterHeroes, timeRange, playerCoplayerResults, dates, fullModes, fullMaps, fullRegions }
}

export default connect(mapStateToProps, { updateTimeDensity, updateRustyStats, updateRustyGraphs, updateFullMode, updateFullMaps, updateFullRegions, updatePreferences, updateDateRange, getMainData, getHeroTalents, rollbackState, updateFilter, selectTalent, addHeroFilter, getTimedData, updateTime, heroSearch, coplayerSearch, selectCoplayer })(DataFilters)

import stringToColor from 'string-to-color'
import { getPlayer, getMatch } from './lib/faceit'
import { select, checkIfEnhanced } from './utils'

function addPlayerCountryFlagElement(country, alignedLeft, target) {
  const element = document.createElement('img')

  element.classList.add('flag--14')

  element.setAttribute(
    'src',
    `https://cdn.faceit.com/frontend/561/assets/images/flags/${country}.png`
  )

  element.setAttribute(
    'style',
    `margin-${alignedLeft ? 'right' : 'left'}: 6px; margin-bottom: 5px;`
  )

  target[alignedLeft ? 'prepend' : 'append'](element)
}

function addPlayerELOElement(elo, target) {
  const element = document.createElement('span')

  element.classList.add('text-muted', 'ellipsis-b')

  element.innerHTML = `ELO: ${elo || '–'}`

  target.append(element)
}

function addTeamELOElement(elo, target) {
  const element = document.createElement('span')

  element.classList.add('text-muted')

  element.setAttribute(
    'style',
    'display: block; margin-top: 6px; font-size: 14px;'
  )

  const totalElo = elo.reduce((acc, curr) => acc + curr, 0)
  const averageElo = Math.round(totalElo / 5)
  element.innerHTML = `Avg. ELO: ${averageElo}<br />Total ELO: ${totalElo}`

  target.append(element)
}

function addPlayerPartyColorElement(partyId, alignedLeft, target) {
  const color = stringToColor(partyId)

  target.setAttribute(
    'style',
    `border-${alignedLeft ? 'left' : 'right'}: 2px solid ${color}`
  )
}

export default function addMatchTeamInfo(target) {
  const teamsElements = Array.from(target.getElementsByTagName('match-team'))

  teamsElements.forEach(async teamElement => {
    const faction = teamElement.getAttribute('members').split('match.')[1]
    const alignedLeft = teamElement.getAttribute('member-align') !== 'right'
    const teamELO = []

    const teamMembersElements = Array.from(
      teamElement.querySelectorAll('div.match-team-member__details__name')
    )

    await Promise.all(
      await teamMembersElements.map(async memberElement => {
        const nicknameElement = memberElement.querySelector(
          'strong[ng-bind="::teamMember.nickname"]'
        )

        if (checkIfEnhanced(nicknameElement)) {
          return
        }

        const nickname = nicknameElement.innerHTML
        const player = await getPlayer(nickname)

        const playerCountry = player.country.toUpperCase()
        addPlayerCountryFlagElement(playerCountry, alignedLeft, nicknameElement)

        const playerELO = player.games.csgo.faceit_elo
        addPlayerELOElement(playerELO, memberElement)
        if (playerELO) {
          teamELO.push(playerELO)
        }

        const matchId = window.location.pathname.split('room/')[1]
        const match = await getMatch(matchId)
        const team = match[faction]
        const playerPartyId = team.find(
          teamMember => teamMember.guid === player.guid
        ).active_team_id
        addPlayerPartyColorElement(
          playerPartyId,
          alignedLeft,
          memberElement.parentElement.parentElement
        )
      })
    )

    if (teamELO.length) {
      const teamNameElement = select(`h2[ng-bind="match.${faction}_nickname"]`)

      if (checkIfEnhanced(teamNameElement)) {
        return
      }

      addTeamELOElement(teamELO, teamNameElement)
    }
  })
}

import { API_URL } from "./utils/config.js";
import { renderHeaderData } from "./header.js";
import { getAccessToken} from "./auth.js";

const currentEpPlaying = {
  episodeID:null
}

let timeout


const audio = document.querySelector('audio')


document.querySelector('.main-play-button').addEventListener('click', ()=>{
  const episodeID = audio.id
  document.querySelectorAll(`.js-episode-${episodeID}`).forEach((element) => {
    element.classList.add('audio-playing')
  })
  document.querySelector('.js-video-play-section').classList.add('audio-playing')
  playAudio(episodeID, audio.currentTime)
})

document.querySelector('.main-pause-button').addEventListener('click', ()=> {
  pauseAudio(audio.id)
})


export async function fetchEpisodes(type, renderer) {
  try {
    const response = await fetch(`${API_URL}/episodes?type=${type}`)

    if(!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }

    const episodes = await response.json()
    renderer(episodes)
  } catch(err) {
    console.log(err.message)
  }
}

export async function fetchShows(type, renderer) {
  try {
    const response = await fetch(`${API_URL}/shows?type=${type}`)

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }

    const shows = await response.json()
    renderer(shows)
  } catch (err) {
    console.log(err.message)
  }
}

async function fetchPlayback(episodeID) {
  try {
    const accessToken = getAccessToken()
    const response = await fetch(`${API_URL}/episodes/${episodeID}/timestamp`, {
      method:'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      withCredentials: true, 
      credentials: 'include'
    })

    if(!response.ok) {
      throw new Error(`Status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (e) {
    console.log(e.message)
    return null
  }
}

async function updatePlayBackTime(episodeID, currenTime) {
  //const currenTime = audio.currentTime
  try {
    const accessToken = getAccessToken()
    const response = await fetch(`${API_URL}/episodes/updatetime?episodeID=${episodeID}&new=${currenTime}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      withCredentials: true, 
      credentials: 'include'
    }
    )

    if(!response.ok) {
      throw new Error(`Status: ${response.status}`)
    }

    const data = await response.json()
    console.log(data)
    return data
  } catch (e) {
    console.log(e.message)
  }
}

export async function fetchaudioAndPlay (episodeID) {
  if (currentEpPlaying.episodeID) {
    //update previously playing ep
    await updatePlayBackTime(currentEpPlaying.episodeID, audio.currentTime)
  }

  let currentTime
  if (getAccessToken()) {
    const playbackTimeObj = await fetchPlayback(episodeID)
    currentTime = playbackTimeObj.currentplaytime
  }

  try {
    const response = await fetch(`${API_URL}/episodes/ep/${episodeID}`)

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`)
    }

    const episode = await response.json()
    audio.crossOrigin="anonymous"
    audio.setAttribute("src", `${API_URL}/episodes/${episode.id}/audio`)
    audio.setAttribute("id", `${episodeID}`)
    
    audio.addEventListener('loadedmetadata', ()=> {
      playAudio(episodeID, currentTime)
      renderHeaderData(episode, audio)
    })
  } catch (err) {
    console.log(err.message)
  }
}

async function playAudio (episodeID, currentTime) {
  if (currentEpPlaying.episodeID) {
    document.querySelectorAll(`.js-episode-${currentEpPlaying.episodeID}`).forEach((element) => {
      element.classList.remove('audio-playing')
    })
  }

  audio.currentTime = currentTime ? currentTime : 0
  audio.play()
  currentEpPlaying.episodeID = episodeID
  document.querySelectorAll(`.js-episode-${episodeID}`).forEach((element) => {
    element.classList.add('audio-playing')
  })

  if (timeout) {
    clearTimeout(timeout)
  }

  timeout = setInterval( async () => {
    if (currentEpPlaying.episodeID) {
      const updateMessage = await updatePlayBackTime(currentEpPlaying.episodeID, audio.currentTime)
      console.log(updateMessage)
    }
  }, 5000)
}


export async function pauseAudio (episodeID) {
  if (getAccessToken()) {
    await updatePlayBackTime(episodeID, audio.currentTime)
  }

  if (timeout) {
    clearTimeout(timeout)
  }

  audio.pause()
  const playingEpContainers = document.querySelectorAll(`.js-episode-${episodeID}`)
  playingEpContainers.forEach((element) => {
    element.classList.remove('audio-playing')
  })
  document.querySelector('.js-video-play-section').classList.remove('audio-playing')
  currentEpPlaying.episodeID = null
}
import { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'
import cheerio from 'cheerio'

export default async (req: VercelRequest, res: VercelResponse) => {
  const originalList = await getRandomIllusts()
  const list = originalList.map(
    ({
      illust_id,
      illust_title,
      url,
      user_name,
      profile_img,
      www_member_illust_medium_url,
      www_user_url,
    }) => {
      return {
        url: url.medium,
        illustId: illust_id,
        illustTitle: illust_title,
        userId: www_user_url.split('/').pop(),
        userName: user_name,
        profileImg: profile_img.main_s,
      }
    }
  )
  res.send(list)
}

export interface RandomIllustsList {
  illust_id: `${number}`
  illust_title: string
  url: {
    medium: string
  }
  user_name: string
  profile_img: {
    main_s: string
  }
  www_member_illust_medium_url: string
  www_user_url: string
}

export async function getRandomIllusts(): Promise<RandomIllustsList[]> {
  const { data } = await axios.get('https://accounts.pixiv.net/login')
  const $ = cheerio.load(data)
  const $meta = $('#init-config')
  try {
    const metaData = JSON.parse($meta.attr('value'))
    return metaData?.['pixivBackgroundSlideshow.illusts']?.landscape || []
  } catch (e) {
    throw e
  }
}

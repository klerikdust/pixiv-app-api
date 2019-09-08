import url from 'url'
import { stringify } from 'querystring'
import crypto from 'crypto'
import axios from 'axios'
import camelcaseKeys from 'camelcase-keys'
import decamelizeKeys from 'decamelize-keys'

const baseURL = 'https://app-api.pixiv.net/'
const instance = axios.create({
  baseURL,
  headers: {
    'App-OS': 'ios',
    'App-OS-Version': '9.3.3',
    'App-Version': '6.0.9'
  }
})

const CLIENT_ID = 'MOBrBDS8blbauoSck0ZfDbtuzpyT'
const CLIENT_SECRET = 'lsACyCD94FhDUtGTXi3QzcFE2uU1hqtDaKeqrdwj'
const HASH_SECRET =
  '28c1fdd170a5204386cb1313c7077b34f83e4aaf4aa829ce78c231e05b0bae2c'
const filter = 'for_ios'

class PixivApp {
  username: string
  password: string
  refreshToken: string
  camelcaseKeys: boolean | undefined
  nextUrl: any
  auth: any
  once: any
  constructor(
    username: string,
    password: string,
    options: { camelcaseKeys: boolean } = { camelcaseKeys: true }
  ) {
    this.username = username
    this.password = password
    this.refreshToken = ''
    if (options.camelcaseKeys) {
      this.camelcaseKeys = true
    }
  }

  // eslint-disable-next-line max-lines-per-function
  async login(username?: string, password?: string) {
    this.username = username || this.username
    this.password = password || this.password

    if (typeof this.username !== 'string') {
      return Promise.reject(
        new TypeError(`Auth is required.
        Expected a string, got ${typeof this.username}`)
      )
    }

    if (typeof this.password !== 'string') {
      return Promise.reject(
        new TypeError(`Auth is required.
        Expected a string, got ${typeof this.password}`)
      )
    }

    const local_time = new Date().toISOString()
    const headers = {
      'X-Client-Time': local_time,
      'X-Client-Hash': crypto
        .createHash('md5')
        .update(Buffer.from(`${local_time}${HASH_SECRET}`, 'utf8'))
        .digest('hex')
    }

    const data: any = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      get_secure_url: 1
    }

    if (this.refreshToken === '') {
      data.grant_type = 'password'
      data.username = this.username
      data.password = this.password
    } else {
      data.grant_type = 'refresh_token'
      data.refresh_token = this.refreshToken
    }
    const axiosResponse = await axios.post(
      'https://oauth.secure.pixiv.net/auth/token',
      stringify(data),
      { headers }
    )

    const { response } = axiosResponse.data
    this.auth = response
    this.refreshToken = axiosResponse.data.response.refresh_token
    instance.defaults.headers.common.Authorization = `Bearer ${response.access_token}`
    return response
  }

  authInfo() {
    return this.auth
  }

  hasNext() {
    return Boolean(this.nextUrl)
  }

  next() {
    return this.fetch(this.nextUrl)
  }

  nextQuery() {
    // @ts-ignore
    return url.parse(this.nextUrl, true).params
  }

  userDetail(id: number, params = {}) {
    params = {
      user_id: id,
      filter,
      ...params
    }

    return this.fetch('/v1/user/detail', { params })
  }

  userIllusts(id, params?: any) {
    params = {
      user_id: id,
      type: 'illust',
      filter,
      ...params
    }

    return this.fetch('/v1/user/illusts', { params })
  }

  userFollowAdd(id, data?: any) {
    if (!id) {
      return Promise.reject(new Error('user_id required'))
    }
    data = {
      user_id: id,
      restrict: 'public',
      filter,
      ...data
    }

    return this.fetch('/v1/user/follow/add', { data })
  }

  userFollowDelete(id, data?: any) {
    if (!id) {
      return Promise.reject(new Error('user_id required'))
    }
    data = {
      user_id: id,
      restrict: 'public',
      filter,
      ...data
    }

    return this.fetch('/v1/user/follow/delete', { data })
  }

  userBookmarksIllust(id, params?: any) {
    if (!id) {
      return Promise.reject(new Error('user_id required'))
    }
    params = {
      user_id: id,
      restrict: 'public',
      filter,
      ...params
    }

    return this.fetch('/v1/user/bookmarks/illust', { params })
  }

  userFollowing(id, params?: any) {
    if (!id) {
      return Promise.reject(new Error('user_id required'))
    }
    params = {
      user_id: id,
      restrict: 'public',
      ...params
    }

    return this.fetch('/v1/user/following', { params })
  }

  userFollower(id, params?: any) {
    if (!id) {
      return Promise.reject(new Error('user_id required'))
    }
    params = {
      user_id: id,
      ...params
    }

    return this.fetch('/v1/user/follower', { params })
  }

  userMypixiv(id, params?: any) {
    if (!id) {
      return Promise.reject(new Error('user_id required'))
    }
    params = {
      user_id: id,
      ...params
    }

    return this.fetch('/v1/user/mypixiv', { params })
  }

  userList(id, params?: any) {
    if (!id) {
      return Promise.reject(new Error('user_id required'))
    }
    params = {
      user_id: id,
      filter,
      ...params
    }

    return this.fetch('/v1/user/list', { params })
  }

  illustDetail(id, params?: any) {
    if (!id) {
      return Promise.reject(new Error('illust_id required'))
    }
    params = {
      illust_id: id,
      filter,
      ...params
    }

    return this.fetch('/v1/illust/detail', { params })
  }

  illustNew(params?: any) {
    params = {
      content_type: 'illust',
      filter,
      ...params
    }

    return this.fetch('/v1/illust/new', { params })
  }

  illustFollow(params?: any) {
    params = {
      restrict: 'public',
      ...params
    }

    return this.fetch('/v2/illust/follow', { params })
  }

  illustComments(id, params?: any) {
    if (!id) {
      return Promise.reject(new Error('illust_id required'))
    }
    params = {
      illust_id: id,
      include_total_comments: 'true',
      ...params
    }

    return this.fetch('/v1/illust/comments', { params })
  }

  illustRelated(id, params?: any) {
    if (!id) {
      return Promise.reject(new Error('illust_id required'))
    }
    params = {
      illust_id: id,
      filter,
      ...params
    }

    return this.fetch('/v2/illust/related', { params })
  }

  illustRecommended(params?: any) {
    params = {
      content_type: 'illust',
      include_ranking_label: 'true',
      filter,
      ...params
    }

    return this.fetch('/v1/illust/recommended', { params })
  }

  illustRecommendedNologin(params?: any) {
    params = {
      include_ranking_illusts: true,
      filter,
      ...params
    }

    return this.fetch('/v1/illust/recommended-nologin', { params })
  }

  illustRanking(params?: any) {
    params = {
      mode: 'day',
      filter,
      ...params
    }

    return this.fetch('/v1/illust/ranking', { params })
  }

  trendingTagsIllust(params?: any) {
    params = {
      filter,
      ...params
    }

    return this.fetch('/v1/trending-tags/illust', { params })
  }

  searchIllust(word, params?: any) {
    if (!word) {
      return Promise.reject(new Error('word required'))
    }
    params = {
      word,
      search_target: 'partial_match_for_tags',
      sort: 'date_desc',
      filter,
      ...params
    }

    return this.fetch('/v1/search/illust', { params })
  }

  searchNovel(word, params?: any) {
    if (!word) {
      return Promise.reject(new Error('word required'))
    }
    params = {
      word,
      search_target: 'partial_match_for_tags',
      sort: 'date_desc',
      filter,
      ...params
    }

    return this.fetch('/v1/search/novel', { params })
  }

  searchUser(word, params?: any) {
    if (!word) {
      return Promise.reject(new Error('word required'))
    }
    params = {
      word,
      filter,
      ...params
    }

    return this.fetch('/v1/search/user', { params })
  }

  searchAutoComplete(word: string) {
    if (!word) {
      return Promise.reject(new Error('word required'))
    }
    return this.fetch('/v1/search/autocomplete', { params: { word } })
  }

  illustBookmarkDetail(id, params?: any) {
    if (!id) {
      return Promise.reject(new Error('illust_id required'))
    }
    params = {
      illust_id: id,
      ...params
    }

    return this.fetch('/v2/illust/bookmark/detail', { params })
  }

  illustBookmarkAdd(id, data?: any) {
    if (!id) {
      return Promise.reject(new Error('illust_id required'))
    }
    data = {
      illust_id: id,
      restrict: 'public',
      ...data
    }

    return this.fetch('/v2/illust/bookmark/add', { data })
  }

  illustBookmarkDelete(id, data?: any) {
    if (!id) {
      return Promise.reject(new Error('illust_id required'))
    }
    data = {
      illust_id: id,
      ...data
    }

    return this.fetch('/v1/illust/bookmark/delete', { data })
  }

  userBookmarkTagsIllust(params?: any) {
    params = {
      restrict: 'public',
      ...params
    }

    return this.fetch('/v1/user/bookmark-tags/illust', { params })
  }

  novelRecommended(params) {
    params = {
      include_ranking_novels: true,
      filter,
      ...params
    }

    return this.fetch('/v1/novel/recommended', { params })
  }

  mangaNew(params) {
    params = {
      content_type: 'manga',
      filter,
      ...params
    }

    return this.fetch('/v1/manga/new', { params })
  }

  mangaRecommended(params) {
    params = {
      include_ranking_label: true,
      filter,
      ...params
    }

    return this.fetch('/v1/manga/recommended', { params })
  }

  novelRecommendedNologin(params) {
    params = {
      include_ranking_novels: true,
      filter,
      ...params
    }

    return this.fetch('/v1/novel/recommended-nologin', { params })
  }

  novelNew(params) {
    return this.fetch('/v1/novel/new', { params })
  }

  fetch(target, options = {}) {
    if (!target) {
      return Promise.reject(new Error('url required'))
    }

    return this._got(target, options).catch(error => {
      if (this.once) {
        this.once = false
        throw error
      }

      return this.login().then(() => {
        this.once = true
        return this._got(target, options)
      })
    })
  }

  _got(target, options?: any) {
    options = options || {}

    if (options.data) {
      options.method = 'post'
      options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
      }

      options.data = stringify(decamelizeKeys(options.data))
    }

    if (options.params) {
      options.params = decamelizeKeys(options.params)
    }

    return instance(target, options).then(response => {
      const { data } = response
      this.nextUrl = data && data.next_url ? data.next_url : null
      return this.camelcaseKeys ? camelcaseKeys(data, { deep: true }) : data
    })
  }
}

export default PixivApp
module.exports.defaults = PixivApp
module.exports = PixivApp
<div align="center">

![PixivNow Logo](src/assets/LogoH.png)

Pixiv Service Proxy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FFreeNowOrg%2FPixivNow&demo-title=PixivNow)

免费部署一个一模一样的服务步骤很简单——点上面的按钮然后一直下一步即可。<br>
各位爹不要再爬我的服务了好吗？100GB/h的额度都能被您爬完了，我自己还怎么看色图呢？<br>
好自为之喵，不要怪我骂人喵。

</div>

## API

您可以使用以下方式传递用户 token 来鉴权：

- Header 以`Authorization`传递
- Cookie 以键名`PHPSESSID`传递

请求路径 `/ajax/*` 的返回结果与 `https://pixiv.net/ajax/*` 的行为完全一致。

以下列举部分 PixivNow 的独特接口：

### `/api/illust/random`

返回随机图片，其实是 `/ajax/illust/discovery` 的语法糖，也支持直接返回图片。

- `max` `{number}` 返回图片的个数
- `mode` `{'all' | 'safe' | 'r18'}` 其中 `r18` 只有在登录状态且参数设置允许时才会返回
- `format` `{'image' | 'json'}` 返回的格式，如果 `Accept` 包含 `image` 则预设为 `image`

### `/api/ranking`

是 `/ranking.php` 的重定向。

### `/user`

通过传入的 token，以 json 格式返回源站 `<meta name="global-data">` 中的用户信息。

## 图片代理

本站的图片使用 CloudFlare Workers 进行代理，可以直接访问欣赏众多插画。

但是由于遭遇了大量不明流量，因此我们暂时开启了图片代理服务的防盗链。如果您有自行部署整站的需要，可以通过在Vercel环境变量`VITE_PXIMG_BASEURL_I`中传入反代url（首选），或修改 `vercel.json`中的对于图片的重定向配置，图片的请求路径与源站完全一致。

---

_For communication and learning only._

**All data & pictures from query:** &copy;Pixiv & Illusts' authors

> Copyright 2021 PixivNow
>
> Licensed under the Apache License, Version 2.0 (the "License");<br>
> you may not use this file except in compliance with the License.<br>
> You may obtain a copy of the License at
>
> http://www.apache.org/licenses/LICENSE-2.0
>
> Unless required by applicable law or agreed to in writing, software<br>
> distributed under the License is distributed on an "AS IS" BASIS,<br>
> WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.<br>
> See the License for the specific language governing permissions and<br>
> limitations under the License.

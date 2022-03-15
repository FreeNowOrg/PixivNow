<div align="center">

![PixivNow Logo](src/assets/LogoH.png)

Pixiv Service Proxy

→ https://pixiv.js.org ←

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

但是本站的图片使用 CloudFlare Workers 进行代理。

由于遭遇了大量不明流量，暂时开启了防盗链，如果您喜欢本站，建议自行部署代理服务。

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

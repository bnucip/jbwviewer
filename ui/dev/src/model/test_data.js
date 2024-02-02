const xmls = [
  '<ju dct="0"><xj id="1"><sbj><att><r sen="001">这个</r><w>=</w></att><r sen="001">这个</r></sbj><prd scp="V"><x>是要</x></prd></xj><xj upt="1:s" rel="转折" id="2"><sbj><x/></sbj><prd scp="V"><x>拿东西</x><w>.</w></prd></xj></ju>',
  '<para><ju dct="0" id="853587"><xj id="1"><sbj><r sen="001">我</r></sbj><adv><r mod="r-q"><r sen="001">这</r><q sen="007">回</q></r></adv><prd scp="VO"><v sen="002">到</v></prd><obj><n>湖南</n><w>，</w></obj></xj><xj id="2" coh="⋮" upt="1:1" rel="顺承"><adv><n sen="001">实地</n></adv><prd scp="VO"><v mod="v2-u"><v sen="001">考察</v><u sen="001">了</u></v></prd><obj><att><n>湘潭</n><w>、</w><cc fun="COO"/><n>湘乡</n><w>、</w><cc fun="COO"/><n>衡山</n><w>、</w><cc fun="COO"/><n>醴陵</n><w>、</w><cc fun="COO"/><n>长沙</n><cc fun="APP"/><n mod="m↗n"><m sen="001">五</m><n sen="001">县</n></n><uu><u sen="001">的</u></uu></att><n sen="001">情况</n><w>。</w></obj></xj></ju><ju dct="0" id="853588"><xj id="1" upt="-1:2:s" rel="解说"><sbj><adv><pp><p sen="008">从</p></pp><t mod="t2◇t2"><t>一月</t><t>四日</t></t></adv><prd scp="V"><v sen="011">起</v></prd><cc fun="UNI"/><adv><pp><p sen="001">至</p></pp><t mod="t2◇t2"><t>二月</t><t>五日</t></t></adv><prd scp="V"><v sen="003">止</v><w>，</w></prd></sbj><adv><d sen="004">共</d></adv><prd scp="VO"><x/></prd><obj><m mod="m3-q"><m>三十二</m><q sen="004">天</q></m><w>，</w></obj></xj><xj id="2"><sbj><x/></sbj><adv><pp><p sen="007">在</p></pp><n sen="001">乡下</n><w>，</w></adv><adv><pp><p sen="007">在</p></pp><n sen="001">县城</n><w>，</w></adv><prd scp="VO"><v sen="001">召集</v></prd><obj><att><prd scp="VO"><v sen="005">有</v></prd><obj><n sen="001">经验</n></obj><uu><u sen="001">的</u></uu></att><n sen="001">农民</n><cc fun="COO"><c sen="103">和</c></cc><att><n mod="n2↗n2"><n>农运</n><n sen="003">工作</n></n></att><n sen="001">同志</n></obj><cc fun="PVT"/><prd scp="VO"><v sen="010">开</v></prd><obj><n mod="v2↗n"><v sen="001">调查</v><n sen="003">会</n></n><w>，</w></obj></xj><xj id="3" coh="⋮" upt="2:5" rel="顺承"><adv><a sen="001">仔细</a></adv><prd scp="VO"><v sen="001">听</v></prd><obj><att><r sen="001">他们</r><uu><u sen="001">的</u></uu></att><n sen="002">报告</n><w>，</w></obj></xj><xj id="4" coh="⋮" upt="3:0" rel="顺承"><sbj><att><n mod="u-v"><u sen="104">所</u><v sen="001">得</v></n></att><n sen="001">材料</n></sbj><adv><d sen="001">不</d></adv><prd scp="V"><a sen="001">少</a><w>。</w></prd></xj></ju></para>',
  '<para><ju dct="0" id="853587"><xj id="1"><sbj><r sen="001">我</r></sbj><adv><r mod="r-q"><r sen="001">这</r><q sen="007">回</q></r></adv><prd scp="VO"><v sen="002">到</v></prd><obj><n>湖南</n><w>，</w></obj></xj><xj id="2" coh="⋮" upt="1:1" rel="顺承"><adv><n sen="001">实地</n></adv><prd scp="VO"><v mod="v2-u"><v sen="001">考察</v><u sen="001">了</u></v></prd><obj><att><n>湘潭</n><w>、</w><cc fun="COO"/><n>湘乡</n><w>、</w><cc fun="COO"/><n>衡山</n><w>、</w><cc fun="COO"/><n>醴陵</n><w>、</w><cc fun="COO"/><n>长沙</n><cc fun="APP"/><n mod="m↗n"><m sen="001">五</m><n sen="001">县</n></n><uu><u sen="001">的</u></uu></att><n sen="001">情况</n><w>。</w></obj></xj></ju><ju dct="0" id="853588"><xj id="1" upt="-1:2:s" rel="解说"><sbj><adv><pp><p sen="008">从</p></pp><t mod="t2◇t2"><t>一月</t><t>四日</t></t></adv><prd scp="V"><v sen="011">起</v></prd><cc fun="UNI"/><adv><pp><p sen="001">至</p></pp><t mod="t2◇t2"><t>二月</t><t>五日</t></t></adv><prd scp="V"><v sen="003">止</v><w>，</w></prd></sbj><adv><d sen="004">共</d></adv><prd scp="VO"><x/></prd><obj><m mod="m3-q"><m>三十二</m><q sen="004">天</q></m><w>，</w></obj></xj><xj id="2"><sbj><x/></sbj><adv><pp><p sen="007">在</p></pp><n sen="001">乡下</n><w>，</w></adv><adv><pp><p sen="007">在</p></pp><n sen="001">县城</n><w>，</w></adv><prd scp="VO"><v sen="001">召集</v></prd><obj><att><prd scp="VO"><v sen="005">有</v></prd><obj><n sen="001">经验</n></obj><uu><u sen="001">的</u></uu></att><n sen="001">农民</n><cc fun="COO"><c sen="103">和</c></cc><att><n mod="n2↗n2"><n>农运</n><n sen="003">工作</n></n></att><n sen="001">同志</n></obj><cc fun="PVT"/><prd scp="VO"><v sen="010">开</v></prd><obj><n mod="v2↗n"><v sen="001">调查</v><n sen="003">会</n></n><w>，</w></obj></xj><xj id="3" coh="⋮" upt="2:5" rel="顺承"><adv><a sen="001">仔细</a></adv><prd scp="VO"><v sen="001">听</v></prd><obj><att><r sen="001">他们</r><uu><u sen="001">的</u></uu></att><n sen="002">报告</n><w>，</w></obj></xj><xj id="4" coh="⋮" upt="3:0" rel="顺承"><sbj><att><n mod="u-v"><u sen="104">所</u><v sen="001">得</v></n></att><n sen="001">材料</n></sbj><adv><d sen="001">不</d></adv><prd scp="V"><a sen="001">少</a><w>。</w></prd></xj></ju><ju dct="0" id="853589"><xj id="1"><sbj><att><m sen="001">许多</m></att><att><n mod="n2↗n2"><n sen="001">农民</n><n sen="005">运动</n></n><uu><u sen="001">的</u></uu></att><n sen="002">道理</n><w>，</w></sbj><adv><pp><p sen="102">和</p></pp><att><adv><pp><p sen="007">在</p></pp><n>汉口</n><w>、</w><cc fun="COO"/><n>长沙</n></adv><adv><pp><p sen="008">从</p></pp><n mod="n2↗n2"><n sen="001">绅士</n><n sen="003">阶级</n></n><cc fun="APP"/><r sen="001">那里</r></adv><prd scp="V"><v mod="v←v"><v sen="001">听</v><v sen="001">得</v></v></prd><uu><u sen="001">的</u></uu></att><n sen="002">道理</n><w>，</w></adv><adv><d sen="002">完全</d></adv><prd scp="V"><a sen="001">相反</a><w>。</w></prd></xj></ju><ju dct="0" id="853590"><xj id="1" upt="-1:1:s" rel="顺承"><sbj><att><m sen="001">许多</m></att><n mod="a↗n"><a sen="101">奇</a><n sen="001">事</n></n><w>，</w></sbj><cc><c sen="101">则</c></cc><prd scp="V"><v sen="001">见所未见</v><w>，</w></prd><cc fun="UNI"/><prd scp="V"><a sen="001">闻所未闻</a><w>。</w></prd></xj></ju><ju dct="0" id="853591"><xj id="1"><sbj><r sen="001">我</r></sbj><prd scp="VO"><v sen="002">想</v></prd><obj><att><r sen="001">这些</r></att><n sen="001">情形</n><w>，</w></obj></xj><xj id="2" upt="1:s" rel="+续宾"><sbj><att><m mod="d→a"><d sen="001">很</d><a sen="001">多</a></m></att><n sen="101">地方</n></sbj><adv><d sen="001">都</d></adv><prd scp="V"><v sen="002">有</v><w>。</w></prd></xj></ju><ju dct="0" id="853592"><xj id="1"><sbj><att><a sen="003">所有</a></att><att><r mod="r-q"><r sen="101">各</r><q sen="106">种</q></r></att><att><prd scp="VO"><v sen="001">反对</v></prd><obj><n mod="n2↗n2"><n sen="001">农民</n><n sen="005">运动</n></n></obj><uu><u sen="001">的</u></uu></att><n sen="002">议论</n><w>，</w></sbj><adv><d sen="001">都</d></adv><adv><d sen="001">必须</d></adv><adv><a sen="001">迅速</a></adv><prd scp="V"><v sen="001">矫正</v><w>。</w></prd></xj></ju><ju dct="0" id="853593"><xj id="1" upt="-1:1:s" rel="顺承"><sbj><att><n mod="a2↗n2"><a sen="002">革命</a><n sen="001">当局</n></n></att><att><pp><p sen="015">对</p></pp><n mod="n2↗n2"><n sen="001">农民</n><n sen="005">运动</n></n><uu><u sen="001">的</u></uu></att><att><r mod="r-q"><r sen="101">各</r><q sen="106">种</q></r></att><att><a sen="001">错误</a></att><n sen="001">处置</n><w>，</w></sbj><adv><d sen="001">必须</d></adv><adv><a sen="001">迅速</a></adv><prd scp="V"><v sen="001">变更</v><w>。</w></prd></xj></ju><ju dct="0" id="853594"><xj id="1" upt="-1:1:s" rel="顺承"><sbj><r sen="001">这样</r><w>，</w></sbj><adv><d sen="103">才</d></adv><adv><pp><p sen="004">于</p></pp><n mod="v2↗n2"><v sen="001">革命</v><n sen="001">前途</n></n></adv><prd scp="V"><v mod="v｜u-v2"><v sen="001">有</v><u sen="104">所</u><v sen="002">补益</v></v><w>。</w></prd></xj></ju><ju dct="0" id="853595"><xj id="1" upt="-1:1:s" rel="因果" sub="↓"><cc><c sen="002">因为</c></cc><sbj><att><t sen="001">目前</t></att><att><n mod="n2↗n2"><n sen="001">农民</n><n sen="005">运动</n></n><uu><u sen="001">的</u></uu></att><n sen="001">兴起</n></sbj><prd scp="VO"><v sen="201">是</v></prd><obj><att><m mod="m-q"><m sen="001">一</m><q sen="101">个</q></m></att><att><adv><d sen="005">极</d></adv><prd scp="V"><a sen="001">大</a></prd><uu><u sen="001">的</u></uu></att><n sen="002">问题</n><w>。</w></obj></xj></ju><ju dct="0" id="853596"><xj id="1"><sbj><x/></sbj><adv><att><adv><d sen="001">很</d></adv><prd scp="V"><a sen="001">短</a></prd><uu><u sen="001">的</u></uu></att><n sen="002">时间</n><ff><f sen="001">内</f><w>，</w></ff></adv><adv><d sen="009">将</d></adv><prd scp="VO"><v sen="002">有</v></prd><obj><att><n>几万万</n></att><n sen="001">农民</n></obj><cc fun="PVT"/><adv><pp><p sen="008">从</p></pp><att><att><n>中国</n></att><f mod="f↗n"><f sen="001">中</f><n sen="001">部</n></f><w>、</w><cc fun="COO"/><f mod="f↗n"><f sen="101">南</f><n sen="001">部</n></f><cc fun="COO"><c sen="103">和</c></cc><f mod="f↗n"><f sen="001">北</f><n sen="001">部</n></f></att><r mod="r↗n"><r sen="101">各</r><n sen="101">省</n></r></adv><prd scp="V"><v sen="003">起来</v><w>，</w></prd></xj><xj id="2" upt="1:s" rel="顺承"><sbj><r mod="r↗n"><r sen="101">其</r><n sen="002">势</n></r></sbj><prd scp="VO"><v sen="002">如</v></prd><obj><n sen="001">暴风骤雨</n><w>，</w></obj></xj><xj id="3" coh="⋮" upt="2:1" rel="顺承"><prd scp="VC"><a sen="001">迅猛</a></prd><cmp><a sen="001">异常</a><w>，</w></cmp></xj><xj id="4" upt="2:s" rel="顺承"><cc><c sen="001">无论</c></cc><sbj><att><r sen="003">什么</r></att><att><a sen="001">大</a><uu><u sen="001">的</u></uu></att><n sen="004">力量</n></sbj><adv><d sen="001">都</d></adv><adv><d sen="009">将</d></adv><prd scp="V"><v mod="v2-d-v"><v sen="001">压抑</v><d sen="001">不</d><v sen="003">住</v></v><w>。</w></prd></xj></ju><ju dct="0" id="853597"><xj id="1"><sbj><r sen="001">他们</r></sbj><adv><d sen="009">将</d></adv><prd scp="VO"><v sen="002">冲决</v></prd><obj><att><r sen="001">一切</r></att><att><prd scp="VO"><v sen="001">束缚</v></prd><obj><r sen="001">他们</r></obj><uu><u sen="001">的</u></uu></att><n sen="001">罗网</n><w>，</w></obj></xj><xj id="2" coh="⋮" upt="1:1" rel="顺承"><adv><pp><p mod="v-u"><v sen="005">朝</v><u sen="204">着</u></p></pp><att><v sen="002">解放</v><uu><u sen="001">的</u></uu></att><n sen="002">路上</n></adv><prd scp="V"><v mod="a→v"><a sen="001">迅</a><v sen="101">跑</v></v><w>。</w></prd></xj></ju><ju dct="0" id="853598"><xj id="1" upt="-1:1:s" rel="顺承"><sbj><att><r sen="001">一切</r></att><n sen="002">帝国主义</n><w>、</w><cc fun="COO"/><n sen="001">军阀</n><w>、</w><cc fun="COO"/><n>贪官污吏</n><w>、</w><cc fun="COO"/><n mod="n2…n2"><n sen="001">土豪</n><n sen="001">劣绅</n></n><w>，</w></sbj><adv><d sen="001">都</d></adv><adv><d sen="009">将</d></adv><adv><pp><p sen="004">被</p></pp><r sen="001">他们</r></adv><prd scp="VO"><v mod="v←v"><v sen="001">葬</v><v sen="001">入</v></v></prd><obj><n sen="001">坟墓</n><w>。</w></obj></xj></ju><ju dct="0" id="853599"><xj id="1" upt="-1:1:s" rel="顺承"><sbj><att><r sen="001">一切</r></att><att><a sen="002">革命</a><uu><u sen="001">的</u></uu></att><n sen="001">党派</n><w>、</w><cc fun="COO"/><att><a sen="002">革命</a><uu><u sen="001">的</u></uu></att><n sen="001">同志</n><w>，</w></sbj><adv><d sen="001">都</d></adv><adv><d sen="009">将</d></adv><adv><pp><p sen="007">在</p></pp><r sen="001">他们</r><ff><f sen="001">面前</f></ff></adv><prd scp="VO"><v sen="001">受</v></prd><obj><att><r sen="001">他们</r><uu><u sen="001">的</u></uu></att><n sen="001">检验</n></obj><cc fun="UNI"><c sen="001">而</c></cc><prd scp="VO"><v sen="001">决定</v></prd><obj><n mod="v…v"><v sen="001">弃</v><v sen="001">取</v></n><w>。</w></obj></xj></ju><ju dct="0" id="853600"><xj id="1" upt="-1:1:s" rel="解说"><sbj><x/></sbj><prd scp="VC"><v sen="001">站</v></prd><cmp><pp><p sen="007">在</p></pp><att><r sen="001">他们</r><uu><u sen="001">的</u></uu></att><f sen="001">前头</f></cmp><cc fun="SER"/><prd scp="VO"><v sen="002">领导</v></prd><obj><r sen="001">他们</r></obj><uv><u sen="004">呢</u><w>？</w></uv></xj></ju><ju dct="0" id="853601"><xj id="1" upt="-1:1:s" rel="选择"><sbj><x/></sbj><cc><c sen="004">还是</c></cc><prd scp="VC"><v sen="001">站</v></prd><cmp><pp><p sen="007">在</p></pp><att><r sen="001">他们</r><uu><u sen="001">的</u></uu></att><f sen="001">后头</f></cmp><cc fun="SER"/><adv><v sen="001">指手画脚</v><uu><u sen="001">地</u></uu></adv><prd scp="VO"><v sen="002">批评</v></prd><obj><r sen="001">他们</r></obj><uv><u sen="004">呢</u><w>？</w></uv></xj></ju><ju dct="0" id="853602"><xj id="1" upt="-1:1:s" rel="选择"><sbj><x/></sbj><cc><c>还是</c></cc><prd scp="VC"><v sen="001">站</v></prd><cmp><pp><p sen="007">在</p></pp><att><r sen="001">他们</r><uu><u sen="001">的</u></uu></att><n sen="001">对面</n></cmp><cc fun="SER"/><prd scp="VO"><v sen="001">反对</v></prd><obj><r sen="001">他们</r></obj><uv><u sen="004">呢</u><w>？</w></uv></xj></ju><ju dct="0" id="853603"><xj id="1" upt="-1:1:s" rel="顺承"><sbj><att><r mod="r-q"><r sen="001">每</r><q sen="101">个</q></r></att><n mod="n2↗n"><n>中国</n><n sen="001">人</n></n></sbj><adv><pp><p sen="001">对于</p></pp><r mod="r↗m-q"><r sen="001">这</r><m sen="001">三</m><q sen="101">项</q></r></adv><adv><d sen="001">都</d></adv><prd scp="VO"><v sen="001">有</v></prd><obj><att><v sen="001">选择</v><uu><u sen="001">的</u></uu></att><n sen="001">自由</n><w>，</w></obj></xj><xj id="2" upt="1:s" rel="转折"><cc><c sen="003">不过</c></cc><sbj><n sen="001">时局</n></sbj><adv><d sen="009">将</d></adv><prd scp="VO"><v sen="001">强迫</v></prd><obj><r sen="001">你</r></obj><cc fun="PVT"/><adv><a sen="001">迅速</a><uu><u sen="001">地</u></uu></adv><prd scp="V"><v sen="001">选择</v></prd><uv><u sen="001">罢了</u><w>。</w></uv></xj></ju></para>',
  '<para><ju dct="0" id="853469"><xj id="1"><sbj><r sen="001">谁</r></sbj><prd scp="VO"><v sen="201">是</v></prd><obj><att><r sen="001">我们</r><uu><u sen="001">的</u></uu></att><n sen="001">敌人</n><w>？</w></obj></xj></ju><ju dct="0" id="853470"><xj id="1" upt="-1:1:s" rel="并列"><sbj><r sen="001">谁</r></sbj><prd scp="VO"><v sen="201">是</v></prd><obj><att><r sen="001">我们</r><uu><u sen="001">的</u></uu></att><n sen="001">朋友</n><w>？</w></obj></xj></ju><ju dct="0" id="853471"><xj id="1" upt="-1:1:s" rel="+接句"><sbj><att><r sen="001">这个</r></att><n sen="002">问题</n></sbj><prd scp="VO"><v sen="201">是</v></prd><obj><att><v sen="001">革命</v><uu><u sen="001">的</u></uu></att><n mod="a2↗n2"><a sen="001">首要</a><n sen="002">问题</n></n><w>。</w></obj></xj></ju><ju dct="0" id="853472"><xj id="1"><sbj><att><n>中国</n></att><att><t sen="001">过去</t></att><att><r sen="001">一切</r></att><n mod="v2↗n2"><v sen="001">革命</v><n sen="001">斗争</n></n></sbj><prd scp="V"><sbj><n sen="001">成效</n></sbj><adv><d sen="103">甚</d></adv><prd scp="V"><a sen="001">少</a><w>，</w></prd></prd></xj><xj id="2" upt="1:s" rel="因果" sub="↑"><sbj><att><r sen="101">其</r></att><n mod="a2↗n2"><a sen="003">基本</a><n sen="001">原因</n></n></sbj><adv><d sen="108">就</d></adv><prd scp="VO"><v sen="201">是</v></prd><obj><pp><p sen="001">因为</p></pp><adv><d sen="001">不</d></adv><prd scp="V"><v sen="104">能</v></prd><cc fun="SYN"/><prd scp="VO"><v sen="001">团结</v></prd><obj><att><a sen="001">真正</a><uu><u sen="001">的</u></uu></att><n sen="001">朋友</n><w>，</w></obj></obj></xj><xj id="3" coh="⋮" upt="2:5" rel="顺承"><cc><c sen="004">以</c></cc><prd scp="VO"><v sen="001">攻击</v></prd><obj><att><a sen="001">真正</a><uu><u sen="001">的</u></uu></att><n sen="001">敌人</n><w>。</w></obj></xj></ju><ju dct="0" id="853473"><xj id="1"><sbj><n mod="v2↗n"><v sen="001">革命</v><n sen="001">党</n></n></sbj><prd scp="VO"><v sen="201">是</v></prd><obj><att><n sen="001">群众</n><uu><u sen="001">的</u></uu></att><n sen="002">向导</n><w>，</w></obj></xj><xj id="2" upt="1:s" rel="顺承"><sbj><pp><p sen="007">在</p></pp><n sen="001">革命</n><ff><f sen="003">中</f></ff></sbj><prd scp="VO"><v mod="d→v"><d sen="001">未</d><v sen="002">有</v></v></prd><obj><sbj><n mod="v2↗n"><v sen="001">革命</v><n sen="001">党</n></n></sbj><prd scp="VO"><v mod="v←a-u"><v sen="006">领</v><a sen="005">错</a><u sen="001">了</u></v></prd><obj><n sen="001">路</n></obj><cc fun="UNI"><c sen="001">而</c></cc><sbj><n sen="001">革命</n></sbj><adv><d sen="001">不</d></adv><prd scp="V"><v sen="002">失败</v></prd><uv><u sen="002">的</u><w>。</w></uv></obj></xj></ju><ju dct="0" id="853474"><xj id="1"><sbj><att><r sen="001">我们</r><uu><u sen="001">的</u></uu></att><n sen="001">革命</n></sbj><prd scp="V"><v sen="204">要</v></prd><cc fun="SYN"/><prd scp="VO"><v sen="001">有</v></prd><obj><att><adv><d sen="001">不</d></adv><prd scp="VO"><v mod="v←a"><v sen="006">领</v><a sen="005">错</a></v></prd><obj><n sen="001">路</n></obj><cc fun="UNI"><c sen="103">和</c></cc><adv><d sen="003">一定</d></adv><prd scp="V"><v sen="001">成功</v></prd><uu><u sen="001">的</u></uu></att><n sen="003">把握</n><w>，</w></obj></xj><xj id="2" upt="1:s" rel="假设" sub="↑"><sbj><x/></sbj><prd scp="V"><v sen="001">不可</v></prd><cc fun="SYN"/><adv><d sen="001">不</d></adv><prd scp="VO"><v sen="001">注意</v></prd><obj><prd scp="VO"><v sen="001">团结</v></prd><obj><att><r sen="001">我们</r><uu><u sen="001">的</u></uu></att><att><a sen="001">真正</a><uu><u sen="001">的</u></uu></att><n sen="001">朋友</n><w>，</w></obj></obj></xj><xj id="3" coh="⋮" upt="2:4" rel="顺承"><cc><c sen="004">以</c></cc><prd scp="VO"><v sen="001">攻击</v></prd><obj><att><r sen="001">我们</r><uu><u sen="001">的</u></uu></att><att><a sen="001">真正</a><uu><u sen="001">的</u></uu></att><n sen="001">敌人</n><w>。</w></obj></xj></ju><ju dct="0" id="853475"><xj id="1"><sbj><r sen="001">我们</r></sbj><prd scp="V"><v sen="204">要</v></prd><cc fun="SYN"/><prd scp="VO"><v sen="001">分辨</v></prd><obj><att><a sen="001">真正</a><uu><u sen="001">的</u></uu></att><n mod="n…n"><n sen="002">敌</n><n sen="001">友</n></n><w>，</w></obj></xj><xj id="2" coh="⋮" upt="1:1" rel="顺承"><prd scp="V"><v sen="001">不可</v></prd><cc fun="SYN"/><adv><d sen="001">不</d></adv><adv><pp><p sen="008">将</p></pp><att><att><n mod="n2↗n2"><n>中国</n><n sen="001">社会</n></n></att><att><r sen="101">各</r></att><n sen="003">阶级</n><uu><u sen="001">的</u></uu></att><n mod="n2↗n2"><n sen="001">经济</n><n sen="001">地位</n></n><cc fun="COO"><c>及其</c></cc><att><pp><p sen="001">对于</p></pp><n sen="001">革命</n><uu><u sen="001">的</u></uu></att><n sen="002">态度</n><w>，</w></adv><prd scp="VO"><v sen="102">作</v></prd><obj><att><m mod="m-q"><m sen="001">一</m><q sen="101">个</q></m></att><att><a sen="002">大概</a><uu><u sen="001">的</u></uu></att><n sen="001">分析</n><w>。</w></obj></xj></ju></para>',
];

const examples = [
  {
    content: "全体代表在会场热烈地讨论了两天教学语法体系问题。",
    xmlStr:
      '<ju dct="0"><xj id="1"><sbj><att><n sen="001">全体</n></att><n sen="001">代表</n></sbj><adv><pp><p sen="007">在</p></pp><n sen="001">会场</n></adv><adv><a sen="001">热烈</a><uu><u sen="001">地</u></uu></adv><prd scp="VCO"><v mod="v2-u"><v sen="001">讨论</v><u sen="001">了</u></v></prd><cmp><m mod="m-q"><m sen="001">两</m><q sen="004">天</q></m></cmp><obj><att><n mod="n2↗n2↗n2"><n sen="101">教学</n><n sen="001">语法</n><n sen="001">体系</n></n></att><n sen="002">问题</n><w>。</w></obj></xj></ju>',
  },
  {
    content: "勤劳的修路工人已经准备了架设天桥的材料。",
    xmlStr:
      '<ju dct="0"><xj id="1"><sbj><att><a sen="001">勤劳</a><uu><u sen="001">的</u></uu></att><n mod="v｜n↗n2"><v sen="002">修</v><n sen="001">路</n><n sen="001">工人</n></n></sbj><adv><d sen="001">已经</d></adv><prd scp="VO"><v mod="v2-u"><v sen="001">准备</v><u sen="001">了</u></v></prd><obj><att><prd scp="VO"><v sen="001">架设</v></prd><obj><n sen="001">天桥</n></obj><uu><u sen="001">的</u></uu></att><n sen="001">材料</n><w>。</w></obj></xj></ju>',
  },
  {
    content: "您对国家不允许名人以患者的身份出现在广告中的规定怎么看？",
    xmlStr:
      '<ju dct="0"><xj id="1"><sbj><r sen="001">您</r></sbj><adv><pp><p sen="015">对</p></pp><att><sbj><n sen="001">国家</n></sbj><adv><d sen="001">不</d></adv><prd scp="VO"><v sen="001">允许</v></prd><obj><n sen="001">名人</n></obj><cc fun="PVT"/><adv><pp><p sen="002">以</p></pp><att><n sen="001">患者</n><uu><u sen="001">的</u></uu></att><n sen="001">身份</n></adv><prd scp="VC"><v sen="002">出现</v></prd><cmp><pp><p sen="007">在</p></pp><n sen="001">广告</n><ff><f sen="003">中</f></ff></cmp><uu><u sen="001">的</u></uu></att><n sen="002">规定</n></adv><adv><r sen="001">怎么</r></adv><prd scp="V"><v sen="101">看</v><w>？</w></prd></xj></ju>',
  },
];

export { xmls, examples };
# 이미지 사용 기록

## 기존 양식 자산

사용자가 만든 양식 연습장 최신본 `cook-exam-demo-2.html`의 `assets` 폴더에서 조리대 2장과 식재료 22장을 복사했습니다. 원본 파일은 수정하지 않았습니다. 다른 양식 재료와 구버전 스크립트는 가져오지 않았습니다.

- `kitchen-counter-bowls.png`: 이미지 위 메뉴 A·B·공통 접시
- `kitchen-counter-order.png`: 도구 반응 영역이 연결된 조리대
- `ingredients/*.png`: 달걀·소고기·채소·조미료 등 기존 식재료 이미지

## 일식 보충 이미지

- 저장 파일: `japanese-ingredients.png`
- 생성 방식: 내장 `image_gen` 도구, `imagegen` 스킬 사용
- 6열 × 7행의 42개 식재료 이미지 시트. 원본 알파 채널을 유지하고 CSS로 셀을 표시합니다.
- 생성 후 별도의 비트맵 편집 없이 복사했습니다. 생성 기본 경로의 파일도 유지했습니다.
- 이름표와 지급 상태가 기준입니다. 사진은 식별용 예시이며 실제 규격·수량을 표현하지 않습니다. 간장 종류, 생선 살 등 일부 공통 형태는 같은 그림을 공유하되 이름과 데이터는 구분합니다.

### 최종 생성 프롬프트

```text
Create ONE production sprite atlas for a Korean Japanese-cooking study app. Scientific-educational food illustration asset. Exactly SIX equal columns and SEVEN equal rows (42 square cells) on a pure white background. Canvas aspect ratio 6:7, high resolution. Each cell has ONE isolated realistic food still life centered within its own invisible square with at least 15% blank padding; objects must NEVER cross cell boundaries. Soft studio light, clean realistic colors, three-quarter food photography, consistent scale and neutral white backdrop. No text, labels, numbers, grid lines, decorative objects, or borders. Row order MUST be exactly:
Row 1 left to right: white cleaned cuttlefish mantle slab; two pink salted pollock roe sacs (mentaiko); small bunch of daikon sprouts; single green serrated shiso leaf; whole pink red sea bream fish; peeled bamboo shoot sections.
Row 2: flat dark dried kombu kelp sheets; small clear bowl of dark soy sauce; small clear bottle of colorless cooking sake; bunch of edible crown daisy greens; small white dish of green-brown ground sansho pepper; pile of pale pink dried bonito flakes.
Row 3: dried crinkled wakame seaweed; long brown burdock roots; small wrinkled green shishito peppers; fresh ginger root; small glass bottle of pale golden mirin; raw grey-purple octopus tentacles.
Row 4: dark bumpy sea cucumber; small dish of red chili powder; cluster of white enoki mushrooms; stack of rectangular black nori seaweed sheets; loose nest of thick white udon noodles; white mung bean sprouts.
Row 5: brown shiitake mushrooms; small bottle of amber sesame oil; bundle of thin brown soba noodles; small mound of green wasabi paste; clear ice cubes; whole slender spotted silver Japanese Spanish mackerel fish.
Row 6: small dish of ivory sesame seeds; one abalone shell with flesh; peeled yellow-green ginkgo nuts; half napa cabbage; pink-edged white fish cake kamaboko slices; two chestnuts.
Row 7: pale dried kanpyo gourd strips loosely coiled; small dish of pink oboro fish flakes; slender silver halfbeak fish with elongated lower jaw; cooked reddish-purple octopus tentacles; pale fresh white fish fillet; beige Japanese miso paste in a small white dish.
App will crop each cell separately by CSS, so exact even 6-column 7-row geometry and subject positions are critical. Photographic ingredient illustrations only, no recipe dishes.
```

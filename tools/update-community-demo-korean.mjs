import mysql from "mysql2/promise";

const users = [
  [2001, "민아"],
  [2002, "준호"],
  [2003, "소라"],
  [2004, "태오"],
  [2005, "유나"],
  [2006, "도윤"],
];

const trips = [
  [3201, "서울 감성 카페 당일치기", "서울", { lunchTime: "12:00", dinnerTime: "18:30", tags: ["서울", "카페", "도심"] }],
  [3202, "오사카 첫날 먹방 루트", "오사카", { lunchTime: "12:30", dinnerTime: "19:00", tags: ["오사카", "먹방", "도보"] }],
  [3203, "도쿄 사진 스팟 산책", "도쿄", { lunchTime: "12:00", dinnerTime: "18:00", tags: ["도쿄", "사진", "카페"] }],
  [3204, "파리 랜드마크 하루 코스", "파리", { lunchTime: "12:00", dinnerTime: "18:30", tags: ["파리", "랜드마크", "포토"] }],
  [3205, "뉴욕 핵심 스팟 빠르게 보기", "뉴욕", { lunchTime: "12:00", dinnerTime: "18:30", tags: ["뉴욕", "핵심", "도심"] }],
  [3206, "삿포로 겨울 감성 하루", "삿포로", { lunchTime: "12:30", dinnerTime: "18:30", tags: ["삿포로", "겨울", "산책"] }],
];

const routes = [
  [
    7101,
    "서울 카페와 야경을 한 번에 담는 당일치기 코스",
    "지하철 이동으로 시작해서 감성 카페와 야경 포인트까지 무리 없이 이어지는 서울 하루 코스입니다.",
  ],
  [
    7102,
    "오사카 도착 첫날 가볍게 즐기는 먹방 루트",
    "무거운 일정 없이 걷기 좋은 구간과 쉬어가기 좋은 카페를 묶은 첫날용 코스입니다.",
  ],
  [
    7103,
    "도쿄 사진 스팟만 골라 걷는 감성 산책",
    "사진이 잘 나오는 장소와 골목 분위기를 중심으로 짧고 밀도 있게 구성한 도쿄 루트입니다.",
  ],
  [
    7104,
    "파리 처음 가는 사람에게 추천하는 랜드마크 코스",
    "이동 부담은 줄이고 상징적인 장소를 알차게 담아낸 파리 하루 루트입니다.",
  ],
  [
    7105,
    "뉴욕 핵심 명소만 빠르게 훑는 시티 하이라이트",
    "짧은 일정으로도 뉴욕 분위기를 가장 진하게 느낄 수 있는 포인트 위주로 정리했습니다.",
  ],
  [
    7106,
    "삿포로 겨울 무드를 천천히 즐기는 하루 코스",
    "산책과 카페, 뷰 포인트를 묶어 겨울 감성을 편하게 즐기기 좋은 루트입니다.",
  ],
];

const routeTags = [
  [8201, "서울"],
  [8202, "카페"],
  [8203, "오사카"],
  [8204, "먹방"],
  [8205, "도쿄"],
  [8206, "사진"],
  [8207, "파리"],
  [8208, "랜드마크"],
  [8209, "뉴욕"],
  [8210, "도심"],
  [8211, "삿포로"],
  [8212, "겨울"],
];

const stops = [
  [5201, "교통 허브", "서울 안에서 움직이기 편한 출발점으로 잡았습니다."],
  [5202, "카페", "점심 전에 들르기 좋은 카페라서 동선 중간에 넣었습니다."],
  [5203, "뷰 포인트", "노을 시간대에 맞춰 마지막 뷰 포인트로 마무리했습니다."],
  [5211, "교통 허브", "도착 직후 이동 부담이 적도록 첫 장소를 배치했습니다."],
  [5212, "액티비티", "점심과 산책을 같이 즐기기 좋아서 가운데에 넣었습니다."],
  [5213, "카페", "오후 분위기가 좋은 카페라 후반부에 두었습니다."],
  [5221, "액티비티", "가볍게 사진 찍기 좋은 장소로 하루를 시작합니다."],
  [5222, "카페", "골목 산책과 카페를 같이 묶기 좋은 구간입니다."],
  [5223, "뷰 포인트", "해질 무렵 풍경을 보기 좋은 장소라 마지막으로 잡았습니다."],
  [5231, "교통 허브", "랜드마크 이동 전에 중심축 역할을 하는 장소입니다."],
  [5232, "액티비티", "중간에 가장 상징적인 장소를 넣어 사진 동선을 살렸습니다."],
  [5233, "뷰 포인트", "넓게 시야가 열리는 시간대에 맞춘 마지막 코스입니다."],
  [5241, "교통 허브", "이동을 압축하기 좋은 출발 포인트입니다."],
  [5242, "액티비티", "한낮 사진이 잘 나오는 지점이라 가운데에 배치했습니다."],
  [5243, "뷰 포인트", "도심 야경을 보기 좋게 마지막 스팟으로 정리했습니다."],
  [5251, "액티비티", "겨울 분위기를 천천히 느끼기 좋은 시작 지점입니다."],
  [5252, "카페", "중간에 몸을 녹일 수 있는 카페를 넣었습니다."],
  [5253, "뷰 포인트", "겨울 사진을 남기기 좋은 마지막 뷰 포인트입니다."],
];

const connection = await mysql.createConnection({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "2364",
  database: "travel",
  charset: "utf8mb4",
});

for (const [id, nickname] of users) {
  await connection.execute("UPDATE users SET nickname = ? WHERE id = ?", [nickname, id]);
}

for (const [id, title, destination, themeJson] of trips) {
  await connection.execute(
    "UPDATE trips SET title = ?, destination = ?, theme_json = ? WHERE id = ?",
    [title, destination, JSON.stringify(themeJson), id],
  );
}

for (const [id, title, description] of routes) {
  await connection.execute(
    "UPDATE community_routes SET title = ?, description = ? WHERE id = ?",
    [title, description, id],
  );
}

for (const [id, tagName] of routeTags) {
  await connection.execute("UPDATE route_tags SET tag_name = ? WHERE id = ?", [tagName, id]);
}

for (const [id, categoryLabel, memo] of stops) {
  await connection.execute(
    "UPDATE trip_stops SET category_label = ?, memo = ? WHERE id = ?",
    [categoryLabel, memo, id],
  );
}

const [authors] = await connection.execute(
  "SELECT id, nickname FROM users WHERE id BETWEEN 2001 AND 2006 ORDER BY id",
);
const [routeRows] = await connection.execute(
  "SELECT id, title FROM community_routes WHERE id BETWEEN 7101 AND 7106 ORDER BY id",
);

console.log(JSON.stringify({ authors, routeRows }, null, 2));

await connection.end();

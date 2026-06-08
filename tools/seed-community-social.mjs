import mysql from "mysql2/promise";

const likeMap = {
  16001: [2009, 12002, 12003, 12004, 12005, 12008, 12010],
  16002: [2009, 12001, 12003, 12004, 12006],
  16003: [2009, 12001, 12002, 12004, 12005, 12006, 12008, 12009],
  16004: [2009, 12001, 12002, 12003, 12005, 12007],
  16005: [2009, 12001, 12002, 12003, 12004, 12006, 12007, 12008, 12009, 12010],
  16006: [2009, 12002, 12003, 12005, 12007, 12008],
  16007: [2009, 12001, 12006],
  16008: [2009, 12003, 12005, 12006, 12009, 12010],
  16009: [2009, 12002, 12005, 12010],
  16010: [2009, 12001, 12007, 12009],
};

const bookmarkMap = {
  16001: [2009, 12002, 12005, 12010],
  16002: [2009, 12001],
  16003: [2009, 12001, 12004, 12008, 12009],
  16004: [2009, 12002, 12007],
  16005: [2009, 12003, 12004, 12006, 12008, 12010],
  16006: [2009, 12001, 12005],
  16007: [12006],
  16008: [2009, 12003, 12009, 12010],
  16009: [2009, 12005],
  16010: [2009, 12007],
};

const comments = [
  [16001, 12010, "성수는 카페만 돌면 지칠 때가 있는데 서울숲이 들어가서 균형이 좋네요."],
  [16001, 12004, "대림창고 웨이팅만 체크하면 거의 그대로 따라가도 괜찮아 보여요."],
  [16001, 2009, "첫 방문자 기준으로 무난하게 짠 루트 같아서 저장해뒀습니다."],
  [16002, 12001, "을지로는 해 지고 나서가 핵심이라 시간 배치가 딱 좋네요."],
  [16002, 12008, "포장마차 거리까지 이어지는 흐름이 자연스러워 보여요."],
  [16003, 12008, "해운대랑 광안리를 하루에 몰지 않은 게 제일 좋네요."],
  [16003, 12009, "광안리 둘째 날에 야경 보는 구성은 저도 비슷하게 다녔어요."],
  [16003, 2009, "부산 처음 가는 사람에게 추천하기 좋은 밸런스입니다."],
  [16004, 12002, "강릉역 기준이라 뚜벅이도 참고하기 좋겠어요."],
  [16004, 12007, "보헤미안 넣은 건 취향이 확실하네요."],
  [16005, 12003, "제주 동쪽은 하루에 몰면 힘든데 3일로 나눈 게 좋아요."],
  [16005, 12006, "광치기해변은 일출 시간에 맞춰도 좋을 것 같아요."],
  [16005, 12009, "렌터카 이동 동선이 깔끔해서 실제로 쓰기 편해 보입니다."],
  [16005, 2009, "동쪽 숙소 잡았을 때 그대로 가져다 써도 괜찮겠네요."],
  [16006, 12007, "황리단길 감성과 유적지를 같이 보는 흐름이 좋아요."],
  [16006, 12001, "동궁과 월지는 저녁으로 둔 게 포인트네요."],
  [16007, 12005, "전주는 하루도 충분하다는 쪽이면 이 루트 괜찮겠어요."],
  [16008, 12005, "여수는 밤 시간이 예뻐서 이런 배치가 훨씬 만족도 높더라고요."],
  [16008, 12003, "케이블카 타는 날을 따로 둔 점이 좋네요."],
  [16008, 2009, "돌산 쪽으로 넘어가는 시간이 늦지 않아서 안정적입니다."],
  [16009, 12004, "속초는 둘째 날 일찍 출발하는 게 진짜 중요하죠."],
  [16009, 12010, "시장과 설악산을 같이 넣어도 무리 없게 조정한 느낌입니다."],
  [16010, 12001, "행궁동은 천천히 걷는 느낌이 좋아서 제목이랑도 잘 맞네요."],
  [16010, 12007, "화성행궁이랑 카페 거리 간격이 적당해서 부담 없어 보여요."],
];

const routeMeta = {
  16001: { forks: 5, views: 228 },
  16002: { forks: 3, views: 156 },
  16003: { forks: 7, views: 347 },
  16004: { forks: 4, views: 264 },
  16005: { forks: 8, views: 418 },
  16006: { forks: 4, views: 231 },
  16007: { forks: 2, views: 119 },
  16008: { forks: 5, views: 287 },
  16009: { forks: 3, views: 194 },
  16010: { forks: 3, views: 173 },
};

const connection = await mysql.createConnection({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "2364",
  database: "travel",
  charset: "utf8mb4",
});

try {
  await connection.beginTransaction();

  await connection.query("UPDATE users SET nickname = '관리자' WHERE role = 'admin'");
  await connection.query(
    "DELETE FROM community_route_bookmarks WHERE community_route_id BETWEEN 16001 AND 16010",
  );
  await connection.query(
    "DELETE FROM community_route_likes WHERE community_route_id BETWEEN 16001 AND 16010",
  );
  await connection.query(
    "DELETE FROM community_route_comments WHERE community_route_id BETWEEN 16001 AND 16010",
  );

  let nextLikeId = 30001;
  for (const [routeId, userIds] of Object.entries(likeMap)) {
    for (const userId of userIds) {
      await connection.query(
        `
          INSERT INTO community_route_likes (
            id,
            community_route_id,
            user_id,
            created_at
          )
          VALUES (?, ?, ?, NOW())
        `,
        [nextLikeId, Number(routeId), userId],
      );
      nextLikeId += 1;
    }
  }

  let nextBookmarkId = 31001;
  for (const [routeId, userIds] of Object.entries(bookmarkMap)) {
    for (const userId of userIds) {
      await connection.query(
        `
          INSERT INTO community_route_bookmarks (
            id,
            community_route_id,
            user_id,
            created_at
          )
          VALUES (?, ?, ?, NOW())
        `,
        [nextBookmarkId, Number(routeId), userId],
      );
      nextBookmarkId += 1;
    }
  }

  let nextCommentId = 32001;
  for (const [routeId, userId, content] of comments) {
    await connection.query(
      `
        INSERT INTO community_route_comments (
          id,
          community_route_id,
          user_id,
          content,
          status,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, 'active', NOW(), NOW())
      `,
      [nextCommentId, routeId, userId, content],
    );
    nextCommentId += 1;
  }

  for (const [routeId, meta] of Object.entries(routeMeta)) {
    const [likeRows] = await connection.query(
      "SELECT COUNT(*) AS count FROM community_route_likes WHERE community_route_id = ?",
      [Number(routeId)],
    );
    const [commentRows] = await connection.query(
      `
        SELECT COUNT(*) AS count
        FROM community_route_comments
        WHERE community_route_id = ?
          AND status = 'active'
      `,
      [Number(routeId)],
    );

    await connection.query(
      `
        UPDATE community_routes
        SET
          like_count = ?,
          comment_count = ?,
          fork_count = ?,
          view_count = ?
        WHERE id = ?
      `,
      [
        Number(likeRows[0].count),
        Number(commentRows[0].count),
        meta.forks,
        meta.views,
        Number(routeId),
      ],
    );
  }

  await connection.commit();
  console.log("Seeded community social activity.");
} catch (error) {
  await connection.rollback();
  console.error(error);
  process.exitCode = 1;
} finally {
  await connection.end();
}

import mysql from "mysql2/promise";

const PASSWORD_HASH = "$2b$12$0PSr8g1Q/dma6RHYMV5Qm.BkZktCAV85oU1412FzmDBPz5OvdVIRC";

const categoryLabels = {
  cafe: "카페",
  activity: "액티비티",
  view: "뷰 포인트",
  transport: "교통 허브",
  restaurant: "맛집",
  attraction: "관광지",
};

const authors = [
  { id: 12001, email: "jeju-drive@travel-master.local", nickname: "주말드라이버" },
  { id: 12002, email: "eastcoast-drive@travel-master.local", nickname: "해안루트러" },
  { id: 12003, email: "busan-nightdrive@travel-master.local", nickname: "야경매니아" },
  { id: 12004, email: "gyeongju-drive@travel-master.local", nickname: "역사도로" },
  { id: 12005, email: "yeosu-drive@travel-master.local", nickname: "밤바다메이트" },
  { id: 12006, email: "suwon-drive@travel-master.local", nickname: "성곽한바퀴" },
  { id: 12007, email: "jeonju-drive@travel-master.local", nickname: "한옥미식가" },
  { id: 12008, email: "namhae-drive@travel-master.local", nickname: "남해러버" },
  { id: 12009, email: "hokkaido-drive@travel-master.local", nickname: "설경드라이브" },
  { id: 12010, email: "la-drive@travel-master.local", nickname: "웨스트코스트러" },
];

const routeDefs = [
  {
    title: "제주 동쪽 해안 드라이브 3일 플랜",
    destination: "제주",
    travelRegion: "korea",
    theme: "coast",
    tags: ["제주", "드라이브", "해안", "렌터카"],
    description:
      "동쪽 해안선을 따라 이동 거리를 한 방향으로 묶어 만든 제주 렌터카 루트입니다. 바다 포인트를 먼저 보고 카페와 산책 지점을 끼워 넣어 피로도를 낮췄습니다.",
    startDate: "2026-07-18",
    lunchTime: "12:10",
    dinnerTime: "18:30",
    featuredHome: true,
    featuredPlanner: false,
    themeName: "제주 동쪽 드라이브",
    startPoint: {
      name: "제주공항 렌터카센터",
      address: "제주특별자치도 제주시 용담2동",
      lat: 33.5064,
      lng: 126.4930,
    },
    endPoint: {
      name: "표선 해안 카페",
      address: "제주특별자치도 서귀포시 표선면 민속해안로",
      lat: 33.3258,
      lng: 126.8391,
    },
    days: [
      {
        note: "첫날은 북동쪽 해안선을 따라 바다 포인트를 연속으로 묶었습니다.",
        stops: [
          {
            name: "함덕해수욕장",
            categoryKey: "view",
            address: "제주특별자치도 제주시 조천읍 조함해안로 525",
            lat: 33.5435,
            lng: 126.6690,
            arrivalTime: "10:20",
            stayMinutes: 70,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "공항에서 바로 진입하기 좋은 첫 바다 포인트입니다.",
          },
          {
            name: "김녕해변",
            categoryKey: "view",
            address: "제주특별자치도 제주시 구좌읍 해맞이해안로",
            lat: 33.5577,
            lng: 126.7593,
            arrivalTime: "11:55",
            stayMinutes: 55,
            travelMinutes: 18,
            distanceKm: 10.8,
            memo: "함덕에서 크게 꺾지 않고 동쪽으로 이어지는 해안 포인트입니다.",
          },
          {
            name: "월정리 오션뷰 카페",
            categoryKey: "cafe",
            address: "제주특별자치도 제주시 구좌읍 월정리 33-3",
            lat: 33.5564,
            lng: 126.7958,
            arrivalTime: "13:00",
            stayMinutes: 80,
            travelMinutes: 12,
            distanceKm: 7.1,
            memo: "점심 이후 휴식 시간을 넣기 좋은 동선상 카페입니다.",
            forked: true,
          },
        ],
      },
      {
        note: "둘째 날은 숲과 성산권을 한 묶음으로 정리해 장거리 왕복을 줄였습니다.",
        stops: [
          {
            name: "비자림",
            categoryKey: "activity",
            address: "제주특별자치도 제주시 구좌읍 비자숲길 55",
            lat: 33.4889,
            lng: 126.8097,
            arrivalTime: "10:00",
            stayMinutes: 90,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "숲 코스를 먼저 두고 성산권으로 내려가는 흐름입니다.",
          },
          {
            name: "성산일출봉",
            categoryKey: "view",
            address: "제주특별자치도 서귀포시 성산읍 성산리 1",
            lat: 33.4589,
            lng: 126.9427,
            arrivalTime: "12:25",
            stayMinutes: 85,
            travelMinutes: 34,
            distanceKm: 22.3,
            memo: "동쪽 메인 랜드마크라서 중간 시간대 핵심 포인트로 배치했습니다.",
          },
          {
            name: "광치기해변",
            categoryKey: "view",
            address: "제주특별자치도 서귀포시 성산읍 고성리 224-33",
            lat: 33.4511,
            lng: 126.9280,
            arrivalTime: "14:10",
            stayMinutes: 50,
            travelMinutes: 8,
            distanceKm: 3.2,
            memo: "성산권에서 무리 없이 이어지는 짧은 해안 구간입니다.",
          },
        ],
      },
      {
        note: "마지막 날은 섭지코지와 표선권만 짧게 끊어 체크아웃 부담을 줄였습니다.",
        stops: [
          {
            name: "섭지코지",
            categoryKey: "activity",
            address: "제주특별자치도 서귀포시 성산읍 고성리",
            lat: 33.4241,
            lng: 126.9293,
            arrivalTime: "10:30",
            stayMinutes: 70,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "오전 시간대 풍경 포인트로 두기 좋은 구간입니다.",
          },
          {
            name: "표선 해안 카페",
            categoryKey: "cafe",
            address: "제주특별자치도 서귀포시 표선면 민속해안로",
            lat: 33.3258,
            lng: 126.8391,
            arrivalTime: "12:10",
            stayMinutes: 80,
            travelMinutes: 27,
            distanceKm: 19.5,
            memo: "공항 복귀 전 쉬어가기 좋은 남동쪽 카페로 마무리했습니다.",
          },
        ],
      },
    ],
    social: {
      likes: 9,
      bookmarks: 6,
      views: 438,
      forks: 8,
      comments: [
        "공항에서 동쪽으로만 밀고 가는 방식이라 운전이 훨씬 편해 보여요.",
        "성산이랑 광치기를 같은 날로 묶은 게 실제로 움직이기 좋아 보입니다.",
        "제주 초행이면 이 정도 구성이 제일 안정적일 것 같아요.",
      ],
    },
  },
  {
    title: "강릉-속초 동해안 드라이브 2일 코스",
    destination: "강릉",
    travelRegion: "korea",
    theme: "coast",
    tags: ["강릉", "속초", "드라이브", "해안"],
    description:
      "동해안 북상 흐름에 맞춰 강릉에서 속초로 올라가는 차량 루트입니다. 왕복 없이 해안선 방향으로 이동해서 이동 스트레스를 줄였습니다.",
    startDate: "2026-07-25",
    lunchTime: "12:00",
    dinnerTime: "18:40",
    featuredHome: false,
    featuredPlanner: true,
    themeName: "동해안 북상 드라이브",
    startPoint: {
      name: "강릉역 주차장",
      address: "강원특별자치도 강릉시 용지로 176",
      lat: 37.7642,
      lng: 128.8992,
    },
    endPoint: {
      name: "속초아이",
      address: "강원특별자치도 속초시 청호해안길 2",
      lat: 38.1976,
      lng: 128.5976,
    },
    days: [
      {
        note: "첫날은 강릉 시내와 주문진까지 한 방향으로 끌고 올라갑니다.",
        stops: [
          {
            name: "안목해변",
            categoryKey: "view",
            address: "강원특별자치도 강릉시 창해로14번길 20-1",
            lat: 37.7714,
            lng: 128.9489,
            arrivalTime: "10:20",
            stayMinutes: 70,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "첫 바다 포인트로 진입하기 가장 편한 위치입니다.",
          },
          {
            name: "강문 카페거리",
            categoryKey: "cafe",
            address: "강원특별자치도 강릉시 창해로350번길",
            lat: 37.7953,
            lng: 128.9189,
            arrivalTime: "11:55",
            stayMinutes: 80,
            travelMinutes: 14,
            distanceKm: 5.8,
            memo: "안목과 묶으면 이동 거리가 짧아 카페 휴식 넣기가 좋습니다.",
            forked: true,
          },
          {
            name: "주문진해변",
            categoryKey: "view",
            address: "강원특별자치도 강릉시 주문진읍 해안로",
            lat: 37.8917,
            lng: 128.8240,
            arrivalTime: "15:10",
            stayMinutes: 65,
            travelMinutes: 33,
            distanceKm: 22.6,
            memo: "강릉권 마지막 구간에서 북쪽으로 크게 이동하는 핵심 구간입니다.",
          },
        ],
      },
      {
        note: "둘째 날은 속초권 포인트만 묶어 도심 회전을 줄였습니다.",
        stops: [
          {
            name: "영금정",
            categoryKey: "view",
            address: "강원특별자치도 속초시 영금정로 43",
            lat: 38.2115,
            lng: 128.6007,
            arrivalTime: "09:50",
            stayMinutes: 55,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "속초권 진입 뒤 가장 먼저 보기 좋은 오션뷰 포인트입니다.",
          },
          {
            name: "아바이마을",
            categoryKey: "activity",
            address: "강원특별자치도 속초시 청호동 1228-1",
            lat: 38.2020,
            lng: 128.5928,
            arrivalTime: "11:00",
            stayMinutes: 60,
            travelMinutes: 8,
            distanceKm: 3.0,
            memo: "영금정과 가까워 점심 구간으로 넣기 좋습니다.",
          },
          {
            name: "속초아이",
            categoryKey: "view",
            address: "강원특별자치도 속초시 청호해안길 2",
            lat: 38.1976,
            lng: 128.5976,
            arrivalTime: "17:20",
            stayMinutes: 70,
            travelMinutes: 10,
            distanceKm: 2.8,
            memo: "야간 조명까지 고려하면 마지막 포인트로 두는 편이 좋습니다.",
          },
        ],
      },
    ],
    social: {
      likes: 8,
      bookmarks: 5,
      views: 362,
      forks: 7,
      comments: [
        "강릉에서 속초로 올라가는 방향이라 되돌아가는 느낌이 없어서 좋아요.",
        "강문이랑 안목을 묶은 다음 주문진으로 빼는 게 꽤 깔끔하네요.",
        "속초 쪽은 둘째 날에만 모아둔 게 실제 운전 피로를 줄여줄 것 같아요.",
      ],
    },
  },
  {
    title: "부산 해안 야경 드라이브 2일 코스",
    destination: "부산",
    travelRegion: "korea",
    theme: "coast",
    tags: ["부산", "야경", "드라이브", "바다"],
    description:
      "동선이 겹치지 않도록 해운대권과 남포권을 나눠 묶은 부산 차량 루트입니다. 야경 포인트는 저녁 시간대에 맞춰 후반부에 배치했습니다.",
    startDate: "2026-08-01",
    lunchTime: "12:10",
    dinnerTime: "19:00",
    themeName: "부산 야경 드라이브",
    startPoint: {
      name: "해운대 렌터카 픽업존",
      address: "부산광역시 해운대구 우동",
      lat: 35.1632,
      lng: 129.1636,
    },
    endPoint: {
      name: "흰여울문화마을 주차장",
      address: "부산광역시 영도구 흰여울길",
      lat: 35.0789,
      lng: 129.0458,
    },
    days: [
      {
        note: "첫날은 해운대권에서 야경 포인트를 중심으로 묶었습니다.",
        stops: [
          {
            name: "해운대해수욕장",
            categoryKey: "view",
            address: "부산광역시 해운대구 해운대해변로 264",
            lat: 35.1587,
            lng: 129.1604,
            arrivalTime: "10:30",
            stayMinutes: 70,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "부산 첫날은 해운대권에서 시작하는 게 동선상 안정적입니다.",
          },
          {
            name: "동백섬",
            categoryKey: "activity",
            address: "부산광역시 해운대구 우동 710-1",
            lat: 35.1549,
            lng: 129.1523,
            arrivalTime: "11:55",
            stayMinutes: 60,
            travelMinutes: 9,
            distanceKm: 2.1,
            memo: "해운대와 붙어 있어 오전 산책 포인트로 넣기 좋습니다.",
          },
          {
            name: "달맞이길 전망 포인트",
            categoryKey: "view",
            address: "부산광역시 해운대구 달맞이길 190",
            lat: 35.1608,
            lng: 129.1797,
            arrivalTime: "18:10",
            stayMinutes: 70,
            travelMinutes: 17,
            distanceKm: 5.2,
            memo: "야경 시작 전에 들러 시티뷰를 보기 좋게 배치했습니다.",
          },
        ],
      },
      {
        note: "둘째 날은 광안리에서 남포 쪽으로 내려가며 야경을 연결합니다.",
        stops: [
          {
            name: "광안리해수욕장",
            categoryKey: "view",
            address: "부산광역시 수영구 광안해변로 219",
            lat: 35.1532,
            lng: 129.1187,
            arrivalTime: "15:30",
            stayMinutes: 75,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "둘째 날 핵심 야경 축을 광안리부터 시작했습니다.",
          },
          {
            name: "민락수변공원",
            categoryKey: "activity",
            address: "부산광역시 수영구 민락수변로 129",
            lat: 35.1545,
            lng: 129.1302,
            arrivalTime: "16:55",
            stayMinutes: 55,
            travelMinutes: 8,
            distanceKm: 2.6,
            memo: "광안대교 뷰를 가까이서 보기에 좋은 짧은 이동 구간입니다.",
          },
          {
            name: "흰여울문화마을",
            categoryKey: "view",
            address: "부산광역시 영도구 흰여울길 379",
            lat: 35.0789,
            lng: 129.0458,
            arrivalTime: "19:20",
            stayMinutes: 65,
            travelMinutes: 32,
            distanceKm: 14.7,
            memo: "마지막 해안 야경을 보기 좋게 종점에 배치했습니다.",
            forked: true,
          },
        ],
      },
    ],
    social: {
      likes: 8,
      bookmarks: 5,
      views: 329,
      forks: 6,
      comments: [
        "광안리랑 흰여울을 하루에 묶은 게 야경 루트로 정말 좋아 보이네요.",
        "해운대권을 하루 따로 뺀 덕분에 운전 피로가 덜할 것 같아요.",
        "달맞이길 넣은 타이밍이 부산 느낌 살리기 좋습니다.",
      ],
    },
  },
  {
    title: "경주 역사 유적 드라이브 2일 코스",
    destination: "경주",
    travelRegion: "korea",
    theme: "urban",
    tags: ["경주", "유적", "드라이브", "야경"],
    description:
      "황리단길과 시내 유적, 불국사권을 날짜별로 분리해 차량 회전을 줄인 경주 드라이브 루트입니다. 도보가 많은 구간은 같은 날 안에서만 묶었습니다.",
    startDate: "2026-08-08",
    lunchTime: "12:00",
    dinnerTime: "18:20",
    themeName: "경주 유적 드라이브",
    startPoint: {
      name: "황리단길 공영주차장",
      address: "경상북도 경주시 포석로 1080",
      lat: 35.8341,
      lng: 129.2144,
    },
    endPoint: {
      name: "보문호 산책로",
      address: "경상북도 경주시 신평동",
      lat: 35.8426,
      lng: 129.2870,
    },
    days: [
      {
        note: "시내권 유적은 도보 전환이 쉬운 순서로 같은 날에 묶었습니다.",
        stops: [
          {
            name: "황리단길",
            categoryKey: "cafe",
            address: "경상북도 경주시 포석로 1080 일대",
            lat: 35.8341,
            lng: 129.2144,
            arrivalTime: "10:50",
            stayMinutes: 80,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "카페와 점심을 같이 해결하기 좋은 출발 포인트입니다.",
            forked: true,
          },
          {
            name: "첨성대",
            categoryKey: "view",
            address: "경상북도 경주시 인왕동 839-1",
            lat: 35.8347,
            lng: 129.2190,
            arrivalTime: "12:25",
            stayMinutes: 45,
            travelMinutes: 7,
            distanceKm: 1.4,
            memo: "황리단길에서 짧게 이어지는 대표 유적 포인트입니다.",
          },
          {
            name: "동궁과 월지",
            categoryKey: "activity",
            address: "경상북도 경주시 원화로 102",
            lat: 35.8350,
            lng: 129.2268,
            arrivalTime: "19:00",
            stayMinutes: 70,
            travelMinutes: 9,
            distanceKm: 2.1,
            memo: "야간 조명 포인트라서 마지막 시간대로 배치했습니다.",
          },
        ],
      },
      {
        note: "둘째 날은 불국사권과 보문단지를 묶어 차량 중심으로 이동합니다.",
        stops: [
          {
            name: "불국사",
            categoryKey: "activity",
            address: "경상북도 경주시 불국로 385",
            lat: 35.7904,
            lng: 129.3320,
            arrivalTime: "09:40",
            stayMinutes: 95,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "둘째 날은 외곽 유적권부터 먼저 들어갑니다.",
          },
          {
            name: "석굴암",
            categoryKey: "view",
            address: "경상북도 경주시 불국로 873-243",
            lat: 35.7950,
            lng: 129.3496,
            arrivalTime: "11:45",
            stayMinutes: 60,
            travelMinutes: 18,
            distanceKm: 8.5,
            memo: "불국사권에서 이어서 보기 가장 자연스러운 산길 구간입니다.",
          },
          {
            name: "보문호",
            categoryKey: "view",
            address: "경상북도 경주시 신평동",
            lat: 35.8426,
            lng: 129.2870,
            arrivalTime: "17:10",
            stayMinutes: 70,
            travelMinutes: 29,
            distanceKm: 14.2,
            memo: "외곽 유적을 보고 돌아오며 쉬어가기 좋은 마지막 포인트입니다.",
          },
        ],
      },
    ],
    social: {
      likes: 7,
      bookmarks: 4,
      views: 276,
      forks: 5,
      comments: [
        "시내 유적이랑 불국사권을 날짜로 나눈 게 정말 합리적이네요.",
        "경주는 걷다가 힘들어지는 경우가 많은데 차량 기준으로 잘 끊은 것 같아요.",
        "동궁과 월지를 저녁으로 둔 게 분위기상 제일 좋습니다.",
      ],
    },
  },
  {
    title: "여수 밤바다 드라이브 2일 코스",
    destination: "여수",
    travelRegion: "korea",
    theme: "coast",
    tags: ["여수", "드라이브", "야경", "케이블카"],
    description:
      "오동도와 구도심, 돌산권을 날짜별로 나눠 야경 시간을 살린 여수 드라이브 코스입니다. 바다를 보면서도 차량 이동이 과하게 꼬이지 않도록 정리했습니다.",
    startDate: "2026-08-15",
    lunchTime: "12:10",
    dinnerTime: "18:50",
    themeName: "여수 야경 드라이브",
    startPoint: {
      name: "여수엑스포역",
      address: "전라남도 여수시 망양로 2",
      lat: 34.7480,
      lng: 127.7457,
    },
    endPoint: {
      name: "낭만포차거리",
      address: "전라남도 여수시 하멜로 102",
      lat: 34.7382,
      lng: 127.7443,
    },
    days: [
      {
        note: "첫날은 역 인근과 구도심을 묶어 도심 이동을 줄였습니다.",
        stops: [
          {
            name: "오동도",
            categoryKey: "activity",
            address: "전라남도 여수시 수정동 산1-11",
            lat: 34.7447,
            lng: 127.7674,
            arrivalTime: "10:40",
            stayMinutes: 80,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "역 근처에서 출발해 첫날 도심 동선을 가볍게 시작합니다.",
          },
          {
            name: "이순신광장",
            categoryKey: "view",
            address: "전라남도 여수시 중앙동 383",
            lat: 34.7392,
            lng: 127.7367,
            arrivalTime: "12:25",
            stayMinutes: 60,
            travelMinutes: 14,
            distanceKm: 3.8,
            memo: "점심과 산책을 같이 묶기 좋은 구도심 핵심 구간입니다.",
          },
          {
            name: "낭만포차거리",
            categoryKey: "cafe",
            address: "전라남도 여수시 하멜로 102",
            lat: 34.7382,
            lng: 127.7443,
            arrivalTime: "18:30",
            stayMinutes: 90,
            travelMinutes: 7,
            distanceKm: 1.5,
            memo: "첫날 밤 분위기를 살리기 가장 좋은 마무리 포인트입니다.",
          },
        ],
      },
      {
        note: "둘째 날은 돌산권을 묶어 케이블카와 전망대를 한 번에 정리합니다.",
        stops: [
          {
            name: "돌산공원",
            categoryKey: "view",
            address: "전라남도 여수시 돌산읍 돌산로 3600-1",
            lat: 34.7414,
            lng: 127.7444,
            arrivalTime: "15:10",
            stayMinutes: 60,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "돌산권 진입 후 첫 뷰 포인트로 잡기 좋은 구간입니다.",
          },
          {
            name: "여수해상케이블카",
            categoryKey: "view",
            address: "전라남도 여수시 돌산읍 돌산로 3600-1",
            lat: 34.7407,
            lng: 127.7422,
            arrivalTime: "16:25",
            stayMinutes: 70,
            travelMinutes: 6,
            distanceKm: 1.0,
            memo: "돌산공원과 붙어 있어 차량 주차 후 이어서 보기 좋습니다.",
            forked: true,
          },
          {
            name: "돌산대교 전망 포인트",
            categoryKey: "view",
            address: "전라남도 여수시 돌산읍 우두리",
            lat: 34.7401,
            lng: 127.7493,
            arrivalTime: "18:05",
            stayMinutes: 50,
            travelMinutes: 5,
            distanceKm: 1.8,
            memo: "야간 조명과 바다 뷰를 함께 보기 좋은 종점입니다.",
          },
        ],
      },
    ],
    social: {
      likes: 7,
      bookmarks: 5,
      views: 298,
      forks: 5,
      comments: [
        "여수는 밤 시간이 중요해서 돌산권을 따로 뺀 게 정말 좋네요.",
        "첫날 구도심, 둘째 날 돌산으로 나눈 게 시연용으로도 직관적이에요.",
        "케이블카 앞뒤 시간이 딱 적당해 보여서 그대로 따라가고 싶습니다.",
      ],
    },
  },
  {
    title: "수원 성곽 야경 드라이브 1일 코스",
    destination: "수원",
    travelRegion: "korea",
    theme: "urban",
    tags: ["수원", "야경", "드라이브", "행궁동"],
    description:
      "수원 화성권을 크게 돌지 않고 성곽-카페-시장-야경 순서로 묶은 1일 차량 루트입니다. 주차 후 짧게 걸을 구간만 남기도록 설계했습니다.",
    startDate: "2026-08-22",
    lunchTime: "12:20",
    dinnerTime: "18:10",
    themeName: "수원 성곽 드라이브",
    startPoint: {
      name: "화성행궁 공영주차장",
      address: "경기도 수원시 팔달구 정조로 825",
      lat: 37.2810,
      lng: 127.0154,
    },
    endPoint: {
      name: "방화수류정",
      address: "경기도 수원시 팔달구 수원천로392번길 44-6",
      lat: 37.2878,
      lng: 127.0209,
    },
    days: [
      {
        note: "성곽권 핵심 포인트만 짧게 끊어 야경 시간대에 맞춰 완성한 코스입니다.",
        stops: [
          {
            name: "화성행궁",
            categoryKey: "activity",
            address: "경기도 수원시 팔달구 정조로 825",
            lat: 37.2810,
            lng: 127.0154,
            arrivalTime: "11:00",
            stayMinutes: 70,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "주차 접근이 쉬워 1일 코스 출발점으로 안정적입니다.",
          },
          {
            name: "행리단길",
            categoryKey: "cafe",
            address: "경기도 수원시 팔달구 정조로 825 일대",
            lat: 37.2818,
            lng: 127.0144,
            arrivalTime: "12:25",
            stayMinutes: 80,
            travelMinutes: 5,
            distanceKm: 0.7,
            memo: "점심과 카페를 같이 해결하기 좋은 짧은 이동 구간입니다.",
            forked: true,
          },
          {
            name: "팔달문시장",
            categoryKey: "restaurant",
            address: "경기도 수원시 팔달구 정조로 776",
            lat: 37.2774,
            lng: 127.0140,
            arrivalTime: "15:10",
            stayMinutes: 50,
            travelMinutes: 7,
            distanceKm: 1.2,
            memo: "시장 구간을 넣어 먹거리와 성곽권 분위기를 같이 보게 했습니다.",
          },
          {
            name: "방화수류정",
            categoryKey: "view",
            address: "경기도 수원시 팔달구 수원천로392번길 44-6",
            lat: 37.2878,
            lng: 127.0209,
            arrivalTime: "18:00",
            stayMinutes: 60,
            travelMinutes: 12,
            distanceKm: 2.0,
            memo: "야경 마무리로 가장 만족도가 높은 포인트라 종점으로 뒀습니다.",
          },
        ],
      },
    ],
    social: {
      likes: 5,
      bookmarks: 3,
      views: 188,
      forks: 3,
      comments: [
        "행궁동은 주차 때문에 애매한데 이렇게 끊으니까 훨씬 따라가기 쉽겠네요.",
        "방화수류정을 마지막에 둔 이유가 명확해서 시연용으로도 좋아 보여요.",
      ],
    },
  },
  {
    title: "전주 한옥 미식 드라이브 1일 코스",
    destination: "전주",
    travelRegion: "korea",
    theme: "cafe",
    tags: ["전주", "한옥", "맛집", "드라이브"],
    description:
      "전주 한옥마을권에서 너무 멀리 벗어나지 않으면서 먹거리와 사진 포인트를 같이 담은 1일 차량 루트입니다. 주차 후 짧은 도보 중심으로 움직이기 좋게 정리했습니다.",
    startDate: "2026-08-29",
    lunchTime: "12:30",
    dinnerTime: "17:50",
    themeName: "전주 한옥 드라이브",
    startPoint: {
      name: "전주 한옥마을 공영주차장",
      address: "전북특별자치도 전주시 완산구 기린대로 99",
      lat: 35.8153,
      lng: 127.1521,
    },
    endPoint: {
      name: "남부시장 청년몰",
      address: "전북특별자치도 전주시 완산구 풍남문1길 19-3",
      lat: 35.8127,
      lng: 127.1456,
    },
    days: [
      {
        note: "주차 이후 이동 반경을 좁게 잡아 먹거리와 사진 포인트를 묶었습니다.",
        stops: [
          {
            name: "전주한옥마을",
            categoryKey: "activity",
            address: "전북특별자치도 전주시 완산구 기린대로 99",
            lat: 35.8153,
            lng: 127.1521,
            arrivalTime: "10:40",
            stayMinutes: 80,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "전주 첫 코스는 주차 후 바로 들어가기 쉬운 한옥마을이 안정적입니다.",
          },
          {
            name: "경기전",
            categoryKey: "activity",
            address: "전북특별자치도 전주시 완산구 태조로 44",
            lat: 35.8151,
            lng: 127.1498,
            arrivalTime: "12:10",
            stayMinutes: 50,
            travelMinutes: 5,
            distanceKm: 0.6,
            memo: "한옥마을과 붙어 있어 짧은 이동으로 이어가기 좋습니다.",
          },
          {
            name: "자만벽화마을",
            categoryKey: "view",
            address: "전북특별자치도 전주시 완산구 자만동 2-1",
            lat: 35.8119,
            lng: 127.1561,
            arrivalTime: "14:10",
            stayMinutes: 55,
            travelMinutes: 9,
            distanceKm: 1.7,
            memo: "오후 사진 포인트로 넣기 좋은 짧은 외곽 이동 구간입니다.",
          },
          {
            name: "남부시장 청년몰",
            categoryKey: "restaurant",
            address: "전북특별자치도 전주시 완산구 풍남문1길 19-3",
            lat: 35.8127,
            lng: 127.1456,
            arrivalTime: "17:10",
            stayMinutes: 75,
            travelMinutes: 8,
            distanceKm: 1.4,
            memo: "먹거리 마무리로 만족도가 높아 마지막 구간으로 배치했습니다.",
            forked: true,
          },
        ],
      },
    ],
    social: {
      likes: 5,
      bookmarks: 2,
      views: 164,
      forks: 3,
      comments: [
        "전주는 주차 이후 동선이 꼬이기 쉬운데 이렇게 좁게 묶은 게 좋네요.",
        "먹거리랑 사진 포인트가 같이 있어서 하루 코스로 부담이 적어 보여요.",
      ],
    },
  },
  {
    title: "남해 해안 드라이브 2일 코스",
    destination: "남해",
    travelRegion: "korea",
    theme: "coast",
    tags: ["남해", "드라이브", "바다", "전망대"],
    description:
      "남해는 포인트 간 거리가 있어서 차량 이동 순서를 잘 짜는 게 중요한데, 서쪽과 남쪽 해안 포인트를 하루씩 나눠 배치한 루트입니다.",
    startDate: "2026-09-05",
    lunchTime: "12:10",
    dinnerTime: "18:20",
    themeName: "남해 해안 드라이브",
    startPoint: {
      name: "남해읍 렌터카 픽업",
      address: "경상남도 남해군 남해읍 화전로",
      lat: 34.8371,
      lng: 127.8929,
    },
    endPoint: {
      name: "상주은모래비치",
      address: "경상남도 남해군 상주면 상주로",
      lat: 34.7209,
      lng: 127.9898,
    },
    days: [
      {
        note: "첫날은 독일마을과 해안 전망대를 한 방향으로 묶었습니다.",
        stops: [
          {
            name: "남해 독일마을",
            categoryKey: "view",
            address: "경상남도 남해군 삼동면 독일로 92",
            lat: 34.7988,
            lng: 128.0423,
            arrivalTime: "10:30",
            stayMinutes: 70,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "남해 대표 랜드마크라 첫날 출발 포인트로 두기 좋습니다.",
          },
          {
            name: "물미해안전망대",
            categoryKey: "view",
            address: "경상남도 남해군 삼동면 동부대로 1030",
            lat: 34.8070,
            lng: 128.0100,
            arrivalTime: "12:05",
            stayMinutes: 45,
            travelMinutes: 12,
            distanceKm: 5.4,
            memo: "독일마을과 같은 축이라 짧게 이어보기 좋습니다.",
          },
          {
            name: "보리암",
            categoryKey: "activity",
            address: "경상남도 남해군 상주면 보리암로 665",
            lat: 34.7518,
            lng: 127.9800,
            arrivalTime: "16:10",
            stayMinutes: 75,
            travelMinutes: 34,
            distanceKm: 18.6,
            memo: "오후 시간을 길게 잡아야 만족도가 높은 핵심 포인트입니다.",
          },
        ],
      },
      {
        note: "둘째 날은 남쪽 해안선 포인트만 묶어 짧게 마무리했습니다.",
        stops: [
          {
            name: "다랭이마을",
            categoryKey: "view",
            address: "경상남도 남해군 남면 남면로 679",
            lat: 34.7174,
            lng: 127.9308,
            arrivalTime: "10:20",
            stayMinutes: 60,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "둘째 날은 남쪽 바다 풍경부터 먼저 보는 흐름입니다.",
          },
          {
            name: "상주은모래비치",
            categoryKey: "view",
            address: "경상남도 남해군 상주면 상주로",
            lat: 34.7209,
            lng: 127.9898,
            arrivalTime: "12:00",
            stayMinutes: 80,
            travelMinutes: 16,
            distanceKm: 7.8,
            memo: "해변에서 쉬는 시간까지 챙기기 좋은 마무리 구간입니다.",
          },
        ],
      },
    ],
    social: {
      likes: 6,
      bookmarks: 4,
      views: 241,
      forks: 4,
      comments: [
        "남해는 방향 잘못 잡으면 운전이 길어지는데 서쪽/남쪽으로 나눈 게 좋습니다.",
        "보리암을 첫날 핵심으로 빼둔 이유가 명확하네요.",
      ],
    },
  },
  {
    title: "홋카이도 비에이-후라노 드라이브 3일 플랜",
    destination: "홋카이도",
    travelRegion: "japan",
    theme: "coast",
    tags: ["일본", "홋카이도", "드라이브", "풍경"],
    description:
      "비에이와 후라노는 포인트 사이 거리가 꽤 있어서 렌터카 기준 동선이 중요합니다. 푸른연못-비에이-후라노 축을 날짜별로 정리해 왕복을 줄였습니다.",
    startDate: "2026-09-18",
    lunchTime: "12:00",
    dinnerTime: "18:10",
    themeName: "홋카이도 드라이브",
    startPoint: {
      name: "아사히카와 공항 렌터카존",
      address: "Higashikagura, Kamikawa District, Hokkaido",
      lat: 43.6708,
      lng: 142.4477,
    },
    endPoint: {
      name: "후라노 치즈공방",
      address: "Nakagoryo, Furano, Hokkaido",
      lat: 43.3400,
      lng: 142.4045,
    },
    days: [
      {
        note: "첫날은 공항에서 비에이 남쪽 포인트만 짧게 묶었습니다.",
        stops: [
          {
            name: "Blue Pond",
            categoryKey: "view",
            address: "Shirogane, Biei, Hokkaido",
            lat: 43.4935,
            lng: 142.6219,
            arrivalTime: "11:00",
            stayMinutes: 55,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "공항에서 바로 진입하기 좋은 대표 포인트입니다.",
          },
          {
            name: "Shirahige Falls",
            categoryKey: "view",
            address: "Shirogane, Biei, Hokkaido",
            lat: 43.4927,
            lng: 142.6191,
            arrivalTime: "12:10",
            stayMinutes: 40,
            travelMinutes: 4,
            distanceKm: 1.1,
            memo: "Blue Pond와 붙어 있어 한 번에 보기 좋습니다.",
          },
        ],
      },
      {
        note: "둘째 날은 비에이-후라노 사이 대형 풍경 포인트를 한 번에 정리했습니다.",
        stops: [
          {
            name: "Shikisai no Oka",
            categoryKey: "view",
            address: "Shinsei Daisan, Biei, Hokkaido",
            lat: 43.5877,
            lng: 142.4594,
            arrivalTime: "10:10",
            stayMinutes: 70,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "비에이 대표 풍경 포인트라 오전 집중 코스로 배치했습니다.",
          },
          {
            name: "Farm Tomita",
            categoryKey: "activity",
            address: "15 Kisenkita, Nakafurano, Hokkaido",
            lat: 43.4050,
            lng: 142.4211,
            arrivalTime: "12:25",
            stayMinutes: 80,
            travelMinutes: 32,
            distanceKm: 25.8,
            memo: "비에이에서 후라노로 내려가며 가장 자연스럽게 이어지는 포인트입니다.",
          },
          {
            name: "Ningle Terrace",
            categoryKey: "cafe",
            address: "Nakagoryo, Furano, Hokkaido",
            lat: 43.3405,
            lng: 142.3838,
            arrivalTime: "17:30",
            stayMinutes: 65,
            travelMinutes: 21,
            distanceKm: 11.6,
            memo: "후라노권 야간 감성을 보기 좋은 마무리 포인트입니다.",
            forked: true,
          },
        ],
      },
      {
        note: "셋째 날은 후라노권만 짧게 묶어 복귀 부담을 줄였습니다.",
        stops: [
          {
            name: "Furano Cheese Factory",
            categoryKey: "activity",
            address: "Nakagoryo, Furano, Hokkaido",
            lat: 43.3400,
            lng: 142.4045,
            arrivalTime: "10:30",
            stayMinutes: 60,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "후라노 마지막 날에 가볍게 들르기 좋은 체험 포인트입니다.",
          },
          {
            name: "Furano Winery Viewpoint",
            categoryKey: "view",
            address: "Shimizuyama, Furano, Hokkaido",
            lat: 43.3343,
            lng: 142.4077,
            arrivalTime: "11:45",
            stayMinutes: 45,
            travelMinutes: 5,
            distanceKm: 1.8,
            memo: "비행 전 짧게 풍경을 보기 좋은 마지막 구간입니다.",
          },
        ],
      },
    ],
    social: {
      likes: 9,
      bookmarks: 6,
      views: 421,
      forks: 7,
      comments: [
        "홋카이도는 렌터카 동선이 중요한데 날짜를 이렇게 나눈 게 정말 좋아 보여요.",
        "비에이랑 후라노를 억지로 하루에 안 넣어서 오히려 현실적입니다.",
        "Ningle Terrace를 둘째 날 저녁으로 둔 게 감성도 챙기고 동선도 좋네요.",
      ],
    },
  },
  {
    title: "LA 해안 드라이브 2일 코스",
    destination: "로스앤젤레스",
    travelRegion: "america",
    theme: "coast",
    tags: ["미국", "LA", "드라이브", "오션뷰"],
    description:
      "LA는 이동 자체가 길어서 서쪽 해안권과 시내 전망권을 나눠 끊는 편이 훨씬 안정적입니다. 해안선과 시내 뷰 포인트를 날짜별로 분리한 차량 최적화 코스입니다.",
    startDate: "2026-10-02",
    lunchTime: "12:20",
    dinnerTime: "18:30",
    themeName: "LA 해안 드라이브",
    startPoint: {
      name: "LAX Rental Car Center",
      address: "1 World Way, Los Angeles, CA",
      lat: 33.9416,
      lng: -118.4085,
    },
    endPoint: {
      name: "Malibu Pier",
      address: "23000 Pacific Coast Hwy, Malibu, CA",
      lat: 34.0375,
      lng: -118.6776,
    },
    days: [
      {
        note: "첫날은 해안권만 묶어 서쪽 구간에서 오래 머무르게 했습니다.",
        stops: [
          {
            name: "Santa Monica Pier",
            categoryKey: "view",
            address: "200 Santa Monica Pier, Santa Monica, CA",
            lat: 34.0094,
            lng: -118.4973,
            arrivalTime: "10:30",
            stayMinutes: 70,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "LA 첫날은 해안권 대표 포인트부터 시작하는 편이 안정적입니다.",
          },
          {
            name: "Venice Canals",
            categoryKey: "activity",
            address: "Venice, CA",
            lat: 33.9847,
            lng: -118.4699,
            arrivalTime: "12:00",
            stayMinutes: 50,
            travelMinutes: 14,
            distanceKm: 5.8,
            memo: "산타모니카와 붙어 있어 같은 날로 묶는 게 효율적입니다.",
          },
          {
            name: "The Getty",
            categoryKey: "view",
            address: "1200 Getty Center Dr, Los Angeles, CA",
            lat: 34.0780,
            lng: -118.4741,
            arrivalTime: "15:20",
            stayMinutes: 85,
            travelMinutes: 26,
            distanceKm: 15.3,
            memo: "서쪽 권역에서 멀리 벗어나지 않는 마지막 포인트입니다.",
          },
        ],
      },
      {
        note: "둘째 날은 시내 전망 포인트를 보고 해안으로 빠지는 방향입니다.",
        stops: [
          {
            name: "Griffith Observatory",
            categoryKey: "view",
            address: "2800 E Observatory Rd, Los Angeles, CA",
            lat: 34.1184,
            lng: -118.3004,
            arrivalTime: "10:10",
            stayMinutes: 70,
            travelMinutes: 0,
            distanceKm: 0,
            memo: "시내 전망 포인트를 오전에 먼저 해결하면 이동 체감이 훨씬 낫습니다.",
          },
          {
            name: "Hollywood Sign Viewpoint",
            categoryKey: "view",
            address: "Mulholland Hwy, Los Angeles, CA",
            lat: 34.1341,
            lng: -118.3215,
            arrivalTime: "11:40",
            stayMinutes: 45,
            travelMinutes: 12,
            distanceKm: 4.9,
            memo: "그리피스와 같은 축이라 짧은 이동으로 이어집니다.",
          },
          {
            name: "Malibu Pier",
            categoryKey: "view",
            address: "23000 Pacific Coast Hwy, Malibu, CA",
            lat: 34.0375,
            lng: -118.6776,
            arrivalTime: "17:20",
            stayMinutes: 80,
            travelMinutes: 48,
            distanceKm: 43.8,
            memo: "마지막 날은 해안 종점까지 길게 빼서 오션뷰로 마무리했습니다.",
            forked: true,
          },
        ],
      },
    ],
    social: {
      likes: 10,
      bookmarks: 7,
      views: 462,
      forks: 8,
      comments: [
        "LA는 하루에 너무 많이 넣으면 피곤한데 서쪽/시내로 나눈 게 좋네요.",
        "그리피스에서 말리부로 빠지는 흐름이 시연용으로도 꽤 임팩트 있어 보여요.",
        "렌터카 여행 기준으로 실제 따라가기 쉬운 편이라 저장해두고 싶습니다.",
      ],
    },
  },
];

function addDays(dateString, offset) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function parseMinutes(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(totalMinutes) {
  const normalized = Math.max(0, Math.round(totalMinutes));
  const hours = String(Math.floor(normalized / 60) % 24).padStart(2, "0");
  const minutes = String(normalized % 60).padStart(2, "0");
  return `${hours}:${minutes}:00`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getCommunityTheme(theme) {
  if (theme === "coast") return "coast";
  if (theme === "cafe") return "cafe";
  return "urban";
}

function buildWarnings(totalDistanceKm, totalTravelMinutes, dayCount) {
  const warnings = [];

  if (totalTravelMinutes >= 120) {
    warnings.push({
      iconKey: "clock",
      title: "이동 시간이 긴 구간이 있습니다",
      description: "운전 피로를 줄이려면 중간 카페나 휴게 포인트를 한 번 더 넣는 편이 안정적입니다.",
    });
  }

  if (totalDistanceKm >= 70 || dayCount >= 3) {
    warnings.push({
      iconKey: "car",
      title: "장거리 운전 비중이 있는 루트입니다",
      description: "숙소 체크인과 식사 시간을 너무 촘촘하게 잡지 않으면 훨씬 편하게 소화할 수 있습니다.",
    });
  }

  return warnings;
}

function pickUsers(excludedUserId, count, seed, pool) {
  const candidates = pool.filter((userId) => userId !== excludedUserId);
  const ordered = candidates
    .map((userId, index) => ({
      userId,
      score: (index * 17 + seed * 13 + userId) % 997,
    }))
    .sort((left, right) => left.score - right.score)
    .map((item) => item.userId);

  return ordered.slice(0, count);
}

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

  const seededUserIds = authors.map((author) => author.id);
  const allKnownUserIds = [2009, ...seededUserIds];

  await connection.query("UPDATE users SET nickname = '관리자' WHERE role = 'admin'");

  await connection.query(
    "DELETE FROM route_forks WHERE community_route_id BETWEEN 16001 AND 16099 OR forked_trip_id BETWEEN 13001 AND 13099 OR user_id BETWEEN 12001 AND 12999",
  );
  await connection.query(
    "DELETE FROM community_route_bookmarks WHERE community_route_id BETWEEN 16001 AND 16099 OR user_id BETWEEN 12001 AND 12999",
  );
  await connection.query(
    "DELETE FROM community_route_comments WHERE community_route_id BETWEEN 16001 AND 16099 OR user_id BETWEEN 12001 AND 12999",
  );
  await connection.query(
    "DELETE FROM community_route_likes WHERE community_route_id BETWEEN 16001 AND 16099 OR user_id BETWEEN 12001 AND 12999",
  );
  await connection.query("DELETE FROM route_tags WHERE community_route_id BETWEEN 16001 AND 16099");
  await connection.query("DELETE FROM community_routes WHERE id BETWEEN 16001 AND 16099");
  await connection.query(
    "DELETE FROM favorites WHERE user_id BETWEEN 12001 AND 12999 OR place_id BETWEEN 22001 AND 22999",
  );
  await connection.query("DELETE FROM trip_analyses WHERE trip_id BETWEEN 13001 AND 13099");
  await connection.query("DELETE FROM trip_stops WHERE trip_day_id BETWEEN 14001 AND 14999");
  await connection.query("DELETE FROM trip_days WHERE trip_id BETWEEN 13001 AND 13099");
  await connection.query("DELETE FROM trips WHERE id BETWEEN 13001 AND 13099");
  await connection.query("DELETE FROM places WHERE id BETWEEN 22001 AND 22999");
  await connection.query("DELETE FROM users WHERE id BETWEEN 12001 AND 12999");

  const userRows = authors.map((author) => [
    author.id,
    author.email,
    PASSWORD_HASH,
    author.nickname,
    "local",
    "active",
    "user",
    new Date(),
    new Date(),
    new Date(),
  ]);

  await connection.query(
    `
      INSERT INTO users (
        id,
        email,
        password_hash,
        nickname,
        provider,
        status,
        role,
        last_login_at,
        created_at,
        updated_at
      )
      VALUES ?
    `,
    [userRows],
  );

  let placeId = 22001;
  let tripId = 13001;
  let dayId = 14001;
  let stopId = 15001;
  let routeId = 16001;
  let analysisId = 17001;
  let tagId = 18001;
  let likeId = 30001;
  let bookmarkId = 31001;
  let commentId = 32001;

  const placeRows = [];
  const tripRows = [];
  const dayRows = [];
  const stopRows = [];
  const analysisRows = [];
  const communityRows = [];
  const tagRows = [];
  const likeRows = [];
  const bookmarkRows = [];
  const commentRows = [];

  for (const [routeIndex, route] of routeDefs.entries()) {
    const currentTripId = tripId++;
    const currentRouteId = routeId++;
    const routePlaces = [];
    const dayStopRecords = [];
    let totalDistanceKm = 0;
    let totalTravelMinutes = 0;
    const communityTheme = getCommunityTheme(route.theme);

    for (const [dayIndex, day] of route.days.entries()) {
      const currentDayId = dayId++;
      const date = addDays(route.startDate, dayIndex);
      dayRows.push([
        currentDayId,
        currentTripId,
        dayIndex + 1,
        date,
        `${dayIndex + 1}일차 일정`,
        day.note,
      ]);

      for (const [stopIndex, stop] of day.stops.entries()) {
        const currentPlaceId = placeId++;
        const leaveMinutes = parseMinutes(stop.arrivalTime) + stop.stayMinutes;

        placeRows.push([
          currentPlaceId,
          stop.name,
          categoryLabels[stop.categoryKey],
          stop.categoryKey,
          stop.address,
          stop.lat,
          stop.lng,
          route.destination,
          "internal",
          `seed-${currentRouteId}-${stopIndex + 1}-${dayIndex + 1}`,
          null,
          null,
          null,
          null,
          null,
          new Date(),
          "seed",
          null,
        ]);

        const position = {
          x: 18 + (stopIndex % 4) * 14,
          y: 32 + dayIndex * 18 + (stopIndex % 3) * 10,
        };

        stopRows.push([
          stopId++,
          currentDayId,
          currentPlaceId,
          stopIndex + 1,
          formatTime(parseMinutes(stop.arrivalTime)),
          formatTime(leaveMinutes),
          "car",
          stop.travelMinutes,
          stop.distanceKm,
          clamp(26 + dayIndex * 5 + stopIndex * 7, 22, 78),
          stop.memo,
          categoryLabels[stop.categoryKey],
          stop.categoryKey,
          stop.stayMinutes,
          position.x,
          position.y,
          Boolean(stop.forked),
        ]);

        routePlaces.push({
          id: currentPlaceId,
          ...stop,
        });

        dayStopRecords.push(stop);
        totalDistanceKm += Number(stop.distanceKm ?? 0);
        totalTravelMinutes += Number(stop.travelMinutes ?? 0);
      }
    }

    const startPoint = route.startPoint ?? {
      name: route.days[0].stops[0].name,
      address: route.days[0].stops[0].address,
      lat: route.days[0].stops[0].lat,
      lng: route.days[0].stops[0].lng,
    };
    const endStop = route.days.at(-1)?.stops.at(-1);
    const endPoint = route.endPoint ??
      (endStop
        ? {
            name: endStop.name,
            address: endStop.address,
            lat: endStop.lat,
            lng: endStop.lng,
          }
        : null);

    tripRows.push([
      currentTripId,
      authors[routeIndex].id,
      route.title,
      route.destination,
      route.startDate,
      addDays(route.startDate, route.days.length - 1),
      route.days.length,
      JSON.stringify({
        lunchTime: route.lunchTime,
        dinnerTime: route.dinnerTime,
        tags: route.tags,
        placeCount: routePlaces.length,
        travelRegion: route.travelRegion,
        startPoint,
        endPoint,
      }),
      "optimized",
      true,
      null,
      Boolean(route.featuredHome),
      Boolean(route.featuredPlanner),
      false,
    ]);

    const fatigueScore = clamp(Math.round(totalTravelMinutes * 0.24 + route.days.length * 6), 18, 62);
    const optimizationScore = clamp(
      Math.round(100 - totalTravelMinutes * 0.11 - totalDistanceKm * 0.08 - route.days.length * 2),
      82,
      97,
    );

    analysisRows.push([
      analysisId++,
      currentTripId,
      Number(totalDistanceKm.toFixed(2)),
      totalTravelMinutes,
      optimizationScore,
      fatigueScore,
      JSON.stringify(buildWarnings(totalDistanceKm, totalTravelMinutes, route.days.length)),
      new Date(),
    ]);

    communityRows.push([
      currentRouteId,
      currentTripId,
      authors[routeIndex].id,
      route.title,
      route.description,
      null,
      communityTheme,
      route.social.views,
      route.social.likes,
      route.social.comments.length,
      route.social.forks,
      "published",
      new Date(),
      new Date(),
    ]);

    for (const tag of route.tags) {
      tagRows.push([tagId++, currentRouteId, tag]);
    }

    const likeUsers = pickUsers(authors[routeIndex].id, route.social.likes, routeIndex + 1, allKnownUserIds);
    for (const userId of likeUsers) {
      likeRows.push([likeId++, currentRouteId, userId, new Date()]);
    }

    const bookmarkUsers = pickUsers(
      authors[routeIndex].id,
      route.social.bookmarks,
      routeIndex + 11,
      allKnownUserIds,
    );
    for (const userId of bookmarkUsers) {
      bookmarkRows.push([bookmarkId++, currentRouteId, userId, new Date()]);
    }

    const commentUsers = pickUsers(
      authors[routeIndex].id,
      route.social.comments.length,
      routeIndex + 21,
      allKnownUserIds,
    );

    route.social.comments.forEach((content, commentIndex) => {
      commentRows.push([
        commentId++,
        currentRouteId,
        commentUsers[commentIndex],
        content,
        "active",
        new Date(),
        new Date(),
      ]);
    });
  }

  await connection.query(
    `
      INSERT INTO places (
        id,
        name,
        category,
        category_key,
        address,
        lat,
        lng,
        region,
        provider,
        provider_place_id,
        phone,
        website_url,
        provider_url,
        opening_hours_json,
        raw_payload_json,
        last_synced_at,
        source_type,
        thumbnail_url
      )
      VALUES ?
    `,
    [placeRows],
  );

  await connection.query(
    `
      INSERT INTO trips (
        id,
        user_id,
        title,
        destination,
        start_date,
        end_date,
        days,
        theme_json,
        status,
        is_public,
        cover_image_url,
        featured_home,
        featured_planner,
        featured_saved
      )
      VALUES ?
    `,
    [tripRows],
  );

  await connection.query(
    `
      INSERT INTO trip_days (
        id,
        trip_id,
        day_number,
        date,
        title,
        notes
      )
      VALUES ?
    `,
    [dayRows],
  );

  await connection.query(
    `
      INSERT INTO trip_stops (
        id,
        trip_day_id,
        place_id,
        stop_order,
        arrival_time,
        leave_time,
        transport_type,
        travel_minutes_from_prev,
        distance_km_from_prev,
        congestion_score,
        memo,
        category_label,
        category_key,
        stay_minutes,
        map_x,
        map_y,
        is_forked
      )
      VALUES ?
    `,
    [stopRows],
  );

  await connection.query(
    `
      INSERT INTO trip_analyses (
        id,
        trip_id,
        total_distance_km,
        total_travel_minutes,
        optimization_score,
        fatigue_score,
        warning_json,
        analyzed_at
      )
      VALUES ?
    `,
    [analysisRows],
  );

  await connection.query(
    `
      INSERT INTO community_routes (
        id,
        trip_id,
        author_user_id,
        title,
        description,
        thumbnail_url,
        theme,
        view_count,
        like_count,
        comment_count,
        fork_count,
        status,
        published_at,
        created_at
      )
      VALUES ?
    `,
    [communityRows],
  );

  await connection.query(
    `
      INSERT INTO route_tags (
        id,
        community_route_id,
        tag_name
      )
      VALUES ?
    `,
    [tagRows],
  );

  await connection.query(
    `
      INSERT INTO community_route_likes (
        id,
        community_route_id,
        user_id,
        created_at
      )
      VALUES ?
    `,
    [likeRows],
  );

  await connection.query(
    `
      INSERT INTO community_route_bookmarks (
        id,
        community_route_id,
        user_id,
        created_at
      )
      VALUES ?
    `,
    [bookmarkRows],
  );

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
      VALUES ?
    `,
    [commentRows],
  );

  await connection.commit();
  console.log("Reseeded showcase community drive routes.");
} catch (error) {
  await connection.rollback();
  console.error(error);
  process.exitCode = 1;
} finally {
  await connection.end();
}

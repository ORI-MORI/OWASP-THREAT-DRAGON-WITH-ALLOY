module user_instance
open n2sf_base
open n2sf_rules

// ============================================================
// [TEMPLATE] 사용자 다이어그램 데이터 주입 영역
// ============================================================

// ---------------------------------------------------------
// 1. Zone (망 영역) 정의
// ---------------------------------------------------------
// [Loop: locations 배열을 순회하며 생성]
/* 예시:
one sig [LOC_ID] extends Location {}
fact { [LOC_ID].grade = [GRADE] and [LOC_ID].type = [TYPE] }
*/

// ---------------------------------------------------------
// 2. Data (업무 정보) 정의
// ---------------------------------------------------------
// [Loop: data 배열을 순회하며 생성]
/* 예시:
one sig [DATA_ID] extends Data {}
fact { [DATA_ID].grade = [GRADE] and [DATA_ID].fileType = [FILE_TYPE] }
*/

// ---------------------------------------------------------
// 3. System (노드) 정의
// ---------------------------------------------------------
// [Loop: systems 배열을 순회하며 생성]
/* 예시:
one sig [SYS_ID] extends System {}
fact {
    [SYS_ID].grade        = [GRADE]
    [SYS_ID].loc          = [LOCATION_ID]
    [SYS_ID].type         = [NODE_TYPE]
    [SYS_ID].authType     = [AUTH_TYPE]
    [SYS_ID].isCDS        = [True/False]
    [SYS_ID].isRegistered = [True/False]
    // 저장된 데이터가 없으면 'none', 있으면 'Data1 + Data2' 형태로 연결
    [SYS_ID].stores       = [DATA_IDS_OR_NONE]
}
*/

// ---------------------------------------------------------
// 4. Connection (연결) 정의
// ---------------------------------------------------------
// [Loop: connections 배열을 순회하며 생성]
/* 예시:
one sig [CONN_ID] extends Connection {}
fact {
    [CONN_ID].from         = [SOURCE_SYS_ID]
    [CONN_ID].to           = [TARGET_SYS_ID]
    [CONN_ID].carries      = [DATA_IDS_OR_NONE]
    [CONN_ID].protocol     = [PROTOCOL]
    [CONN_ID].isEncrypted  = [True/False]
    [CONN_ID].hasCDR       = [True/False]
    [CONN_ID].hasAntiVirus = [True/False]
}
*/

// ---------------------------------------------------------
// 5. 실행 명령
// ---------------------------------------------------------
run {}

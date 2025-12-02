module user_instance_real
open n2sf_base
open n2sf_rules

// ============================================================
// [TEMPLATE] 사용자 다이어그램 데이터 주입 영역
// ============================================================

// ---------------------------------------------------------
// 1. Zone (망 영역) 정의
// ---------------------------------------------------------
one sig Location1 extends Location {}
fact { Location1.grade = Sensitive and Location1.type = Intranet }

one sig Location2 extends Location {}
fact { Location2.grade = Open and Location2.type = Internet }

one sig Location3 extends Location {}
fact { Location3.grade = Open and Location3.type = Internet }


/* 예시:
one sig [LOC_ID] extends Location {}
fact { [LOC_ID].grade = [GRADE] and [LOC_ID].type = [TYPE] }
*/

// ---------------------------------------------------------
// 2. Data (업무 정보) 정의
// ---------------------------------------------------------

/* 예시:
one sig [DATA_ID] extends Data {}
fact { [DATA_ID].grade = [GRADE] and [DATA_ID].fileType = [FILE_TYPE] }
*/

// ---------------------------------------------------------
// 3. System (노드) 정의
// ---------------------------------------------------------
one sig System100 extends System {}
fact {
    System100.grade = Sensitive
    System100.loc = Location1
    System100.type = Terminal
    System100.authType = Single
    System100.isCDS = False
    System100.isRegistered = False
    System100.stores = none
}

one sig System101 extends System {}
fact {
    System101.grade = Sensitive
    System101.loc = Location1
    System101.type = Terminal
    System101.authType = Single
    System101.isCDS = False
    System101.isRegistered = False
    System101.stores = none
}

one sig System102 extends System {}
fact {
    System102.grade = Open
    System102.loc = Location1
    System102.type = NetworkDevice
    System102.authType = Single
    System102.isCDS = False
    System102.isRegistered = False
    System102.stores = none
}

one sig System103 extends System {}
fact {
    System103.grade = Open
    System103.loc = Location1
    System103.type = Server
    System103.authType = Single
    System103.isCDS = False
    System103.isRegistered = False
    System103.stores = none
}


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
one sig Connection01 extends Connection {}
fact {
    Connection01.from = System100
    Connection01.to = System101
    Connection01.carries = none
    Connection01.protocol = HTTPS
    Connection01.isEncrypted = False
    Connection01.hasCDR = False
    Connection01.hasAntiVirus = False
}

one sig Connection12 extends Connection {}
fact {
    Connection12.from = System101
    Connection12.to = System102
    Connection12.carries = none
    Connection12.protocol = HTTPS
    Connection12.isEncrypted = False
    Connection12.hasCDR = False
    Connection12.hasAntiVirus = False
}


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

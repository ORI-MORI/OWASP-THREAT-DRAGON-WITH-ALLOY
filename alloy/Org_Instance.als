module Org_Instance

/* [1. 참조] 모델 2 (생성형 AI) 선택 */
open N2SF_Model2_Catalog
open N2SF_Controls_DB 

/* ============================================================
   [2. 자산 정의] 
   ============================================================ */

// 2-1. 내부 PC (S등급, 정상)
one sig Dev_PC extends Asset {} 
fact { 
    Dev_PC.level = Sensitive 
    Dev_PC.zone = Internal
    Dev_PC.status = Secure
    Dev_PC.is_registered = True
    Dev_PC.has_agent = True
}

// 2-2. 외부 AI (O등급, 정상)
one sig ChatGPT extends Asset {}
fact { 
    ChatGPT.level = Open 
    ChatGPT.zone = External
    ChatGPT.status = Secure
    ChatGPT.is_registered = True
    ChatGPT.has_agent = True 
}

// 2-3. 망연계 장비 (설치는 되어 있음)
one sig My_Relay extends Relay {}
fact {
    My_Relay.level = Sensitive
    My_Relay.zone = Internal
    My_Relay.status = Secure
    My_Relay.is_registered = True
    My_Relay.has_agent = True
}

/* ============================================================
   [3. 데이터 및 흐름 정의] 
   ============================================================ */

// 3-1. 데이터 (S등급 회의록)
one sig Meeting_Log extends Data {}
fact { 
    Meeting_Log.classification = Sensitive
    Meeting_Log.content = Clean
    Meeting_Log.is_sanitized = True
}

// 3-2. 흐름 (PC -> AI, 직접 접속, 평문)
one sig Upload_Action extends Flow {}
fact {
    Upload_Action.from = Dev_PC
    Upload_Action.to = ChatGPT
    Upload_Action.data = Meeting_Log
    
    // [문제 1] 경로(via)에 My_Relay가 없음 -> 우회 접속
    Upload_Action.via = none 
    
    // [문제 2] 암호화 안 함 -> 평문 전송
    Upload_Action.is_encrypted = False 
}

/* ============================================================
   [4. 구현 현황] 
   ============================================================ */
fact Define_Org_Security {
    // [문제 3] 필수 통제(EB-6, IF-2 등) 누락
    Org_Implementation.implemented = N2SF_EB_1 // 접점 제한만 있음
    
    Org_Implementation.exceptions = none
}

/* ============================================================
   [5. 검증 실행] 
   ============================================================ */
assert Policy_Compliance {
    Check_Security_Pass
}
check Policy_Compliance for 3

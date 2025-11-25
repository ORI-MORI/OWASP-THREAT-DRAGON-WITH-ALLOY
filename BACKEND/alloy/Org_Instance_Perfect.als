/* ============================================================
   [표준 템플릿 적용] N2SF 기관 현황 인스턴스 (성공 사례)
   * 시나리오: 연계체계 경유, 암호화 적용, 필수 통제 완비
   ============================================================ */
module Org_Instance

/* 1. 모델 및 DB 참조 */
open N2SF_Model2_Catalog // 생성형 AI 모델
open N2SF_Controls_DB

/* ============================================================
   2. 자산(Asset) 정의
   * 자산의 상태(Status)와 에이전트 설치 여부까지 꼼꼼하게 정의
   ============================================================ */
// 2-1. 내부 PC (S등급, 정상, 에이전트 설치됨)
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

// 2-3. ★ 연계체계 (Relay) - 설치됨
one sig AI_Gateway extends Relay {} 
fact {
    AI_Gateway.level = Sensitive
    AI_Gateway.zone = Internal
    AI_Gateway.status = Secure
    AI_Gateway.is_registered = True
    AI_Gateway.has_agent = True
}

/* ============================================================
   3. 데이터(Data) 및 흐름(Flow) 정의
   * 안전한 데이터와 경로 설정
   ============================================================ */
// 3-1. 데이터 (S등급, 무해화 처리됨)
one sig Meeting_Log extends Data {}
fact { 
    Meeting_Log.classification = Sensitive
    Meeting_Log.content = Clean
    Meeting_Log.is_sanitized = True // 무해화 완료 -> 악성 콘텐츠 위협 해소
}

// 3-2. 흐름 (PC -> Gateway -> AI, 암호화 적용)
one sig Safe_Upload_Action extends Flow {}
fact {
    Safe_Upload_Action.from = Dev_PC
    Safe_Upload_Action.to = ChatGPT
    Safe_Upload_Action.data = Meeting_Log
    
    // [방어 포인트 1] 경로(via)에 Relay 포함 -> 우회 접속 위협 해소
    Safe_Upload_Action.via = AI_Gateway
    
    // [방어 포인트 2] 암호화 적용 -> 평문 전송 위협 해소
    Safe_Upload_Action.is_encrypted = True 
}

/* ============================================================
   4. 보안 대책 구현 현황 (Implementation)
   * Catalog에서 요구하는 필수 통제들을 모두 포함
   ============================================================ */
fact Define_Org_Security {
    Org_Implementation.implemented = 
        // [Req 1: 우회 차단]
        N2SF_EB_1 + N2SF_EB_6 + N2SF_IS_4 +
        // [Req 2: 데이터 보호]
        N2SF_IF_6 + N2SF_IF_2 + N2SF_DU_M3 +
        // [Req 3: 악성 차단]
        N2SF_IF_3 + N2SF_IF_5
    
    Org_Implementation.exceptions = none
}

/* ============================================================
   5. 검증 실행 (Verification)
   ============================================================ */
assert Policy_Compliance {
    Check_Security_Pass
}
check Policy_Compliance for 3

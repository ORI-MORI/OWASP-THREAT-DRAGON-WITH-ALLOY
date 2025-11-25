/* ============================================================
   [표준 템플릿 적용] N2SF 정보서비스 모델 카탈로그
   * 모델명: 모델 2. 업무환경에서 생성형 AI 활용
   * 근거: 국가 망 보안체계 보안 가이드라인 부록 2-2
   ============================================================ */
module N2SF_Model2_Catalog

/* 1. 필수 모듈 참조 (고정) */
open N2SF_Core          // 5대 탐지 엔진
open N2SF_Controls_DB   // 보안통제 라이브러리

/* ============================================================
   2. 위협 정의 (Threat Definition)
   * 근거: [부록 2-2] <표 2-1> 정보서비스 보안위협 (p.15)
   ============================================================ */
// [TH-M2-21] 생성형 AI 서비스를 통한 업무정보 유출 (Data Leak)
one sig TH_M2_21 extends Threat {} 

// [TH-M2-10] 이용자 단말의 AI 연계체계 우회 등 비인가 네트워크 연결 (Bypass)
one sig TH_M2_10 extends Threat {} 

// [TH-M2-15] 외부로부터의 악성 콘텐츠 유입 (Malicious Content)
one sig TH_M2_15 extends Threat {}

// [TH-M2-07] 비인가 및 보안통제 미조치 단말의 접근 (Integrity Fail)
one sig TH_M2_07 extends Threat {}


/* ============================================================
   3. 요구사항 정의 (Requirement Definition)
   * 근거: [부록 2-2] <표 2-2> 보안 요구사항 (p.16~18)
   ============================================================ */
// [REQ-1] 데이터 보호 요구사항 (암호화, 필터링 등)
one sig Req_Data_Protection extends Requirement {} 

// [REQ-2] 비인가 네트워크 연결 차단 (망 분리, 접점 제한)
one sig Req_Block_Bypass extends Requirement {} 

// [REQ-3] 악성 콘텐츠 유입 차단
one sig Req_Block_Malware extends Requirement {}

// [REQ-4] 단말 보안성 유지 (무결성 확보)
one sig Req_Device_Integrity extends Requirement {}


/* ============================================================
   4. 탐지 로직 매핑 (Detection Logic) - [수정됨]
   * "패턴이 있을 때만(iff)" 위협으로 간주하도록 엄격하게 정의
   ============================================================ */
fact Detect_Threats {
    
    // [Flow 검사]
    all f: Flow | {
        // 1. 정보 유출 위협 (TH_M2_21)
        // 조건: 데이터 유출 패턴 OR 평문 전송 패턴
        (TH_M2_21 in f.has_threat) <=> (Template_Data_Leak[f] or Template_Unencrypted[f])
        
        // 2. 우회 접속 위협 (TH_M2_10)
        // 조건: 우회 접속 패턴
        (TH_M2_10 in f.has_threat) <=> (Template_Bypass[f])
        
        // 3. 악성 콘텐츠 위협 (TH_M2_15)
        // 조건: 운반하는 데이터가 악성/미소독 상태
        (TH_M2_15 in f.has_threat) <=> (Template_Prohibited_Content_Data[f.data])

        // 4. 무결성 위반 위협 (TH_M2_07)
        // 조건: 출발지 자산(from)이 무결성 위반 상태
        (TH_M2_07 in f.has_threat) <=> (Template_Integrity_Fail[f.from])
    }
}

/* *보조 Predicate */
pred Template_Prohibited_Content_Data [d: Data] {
    d.content = Malicious or d.is_sanitized = False
}


/* ============================================================
   5. 처방전 매핑 (Prescription)
   * 위협 -> 요구사항 -> 통제 항목 (AND 조건)
   * 근거: [부록 2-2] <표 2-2> 매핑 테이블
   ============================================================ */
fact Define_Requirements {
    // (1) 위협과 요구사항 연결
    TH_M2_21.requires = Req_Data_Protection
    TH_M2_10.requires = Req_Block_Bypass
    TH_M2_15.requires = Req_Block_Malware
    TH_M2_07.requires = Req_Device_Integrity
    
    // (2) 요구사항과 필수 통제(DB 부품) 연결
    
    // [Req_Data_Protection] 필수 통제
    Req_Data_Protection.mitigated_by = 
        N2SF_IF_6 +   // 필터링 규칙 정보흐름 통제
        N2SF_IF_2 +   // 암호화된 정보흐름 통제
        N2SF_DU_M3    // 데이터 사용 정책 수립
        
    // [Req_Block_Bypass] 필수 통제
    Req_Block_Bypass.mitigated_by = 
        N2SF_EB_1 +   // 연결 접점 제한
        N2SF_EB_6 +   // 외부 발신 차단
        N2SF_IS_4     // 네트워크 격리

    // [Req_Block_Malware] 필수 통제
    Req_Block_Malware.mitigated_by = 
        N2SF_IF_3 +   // 임베디드 데이터 삽입 차단
        N2SF_IF_5     // 일방향 정보흐름 통제

    // [Req_Device_Integrity] 필수 통제
    Req_Device_Integrity.mitigated_by =
        N2SF_DA_1 +   // 단말 무결성 검증
        N2SF_DA_3     // 단말 식별 및 인증
}

/* ============================================================
   ★ 6. 감찰 프로세스 (Meta-Verification)
   * "엔진이 탐지했는데 위협 ID가 누락된 경우"를 찾아내는 안전장치
   ============================================================ */
assert Verify_Catalog_Completeness {
    all f: Flow | {
        // [엔진 1] 정보 유출 시 -> TH_M2_21 태깅 확인
        Template_Data_Leak[f]        implies TH_M2_21 in f.has_threat
        
        // [엔진 2] 우회 접속 시 -> TH_M2_10 태깅 확인
        Template_Bypass[f]           implies TH_M2_10 in f.has_threat
        
        // [엔진 3] 평문 전송 시 -> TH_M2_21 태깅 확인
        Template_Unencrypted[f]      implies TH_M2_21 in f.has_threat
        
        // [엔진 4] 악성 콘텐츠 시 -> TH_M2_15 태깅 확인
        Template_Prohibited_Content[f] implies TH_M2_15 in f.has_threat
        
        // [엔진 5] 무결성 위반 시 -> TH_M2_07 태깅 확인
        Template_Integrity_Fail[f.from] implies TH_M2_07 in f.has_threat
    }
}

// [개발자용] 이 명령을 실행했을 때 반례가 나오면 "위협 정의 누락"입니다.
// check Verify_Catalog_Completeness for 5

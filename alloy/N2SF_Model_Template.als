/* ============================================================
   [표준 템플릿] N2SF 정보서비스 모델 카탈로그
   * 모델명: [모델 이름] (예: 생성형 AI, 클라우드 협업 등)
   * 작성자: [작성자]
   * 버전: v2.0 (엄격한 탐지 모드 적용)
   ============================================================ */
module N2SF_ModelX_Catalog  // [변경] 파일명에 맞춰 수정

/* 1. 필수 모듈 참조 */
open N2SF_Core          // 5대 탐지 엔진
open N2SF_Controls_DB   // 보안통제 라이브러리

/* ============================================================
   2. 위협 정의 (Threat Definition)
   * 근거: 해당 모델 가이드라인 <표 2-1> 정보서비스 보안위협
   ============================================================ */
// [변경] 모델에 맞는 위협 ID를 정의하십시오.
one sig TH_MX_01 extends Threat {} // [예시] 정보 유출
one sig TH_MX_02 extends Threat {} // [예시] 우회 접속
one sig TH_MX_03 extends Threat {} // [예시] 악성 콘텐츠
one sig TH_MX_04 extends Threat {} // [예시] 무결성 위반
// ... 필요한 만큼 추가

/* ============================================================
   3. 요구사항 정의 (Requirement Definition)
   * 근거: 해당 모델 가이드라인 <표 2-2> 보안 요구사항
   ============================================================ */
// [변경] 위협을 해소하기 위한 요구사항 그룹 정의
one sig Req_Group_A extends Requirement {} 
one sig Req_Group_B extends Requirement {}
// ... 필요한 만큼 추가

/* ============================================================
   4. 탐지 로직 매핑 (Detection Logic)
   * Core의 '5대 엔진'을 사용하여 위협을 자동 식별
   * [중요] 'iff (<=>)' 연산자를 사용하여 패턴이 있을 때만 위협으로 간주
   ============================================================ */
fact Detect_Threats {
    
    // [Flow 검사] 데이터 흐름 관련 위협
    all f: Flow | {
        // [템플릿 1] 정보 유출 (Data Leak)
        // 조건: 데이터 등급 > 목적지 자산 등급
        (TH_MX_01 in f.has_threat) <=> Template_Data_Leak[f]
        
        // [템플릿 2] 우회 접속 (Bypass)
        // 조건: 필수 경유지(Relay) 미경유
        (TH_MX_02 in f.has_threat) <=> Template_Bypass[f]
        
        // [템플릿 3] 평문 전송 (Unencrypted)
        // 조건: 외부 구간 암호화 미적용
        // (필요시 다른 위협 ID와 매핑 가능)
        (TH_MX_01 in f.has_threat) <=> (Template_Data_Leak[f] or Template_Unencrypted[f])
    }

    // [Data 검사] 콘텐츠 관련 위협
    all d: Data | {
        // [템플릿 4] 위험 콘텐츠 (Prohibited Content)
        // 조건: 악성코드 포함 또는 무해화 미처리
        // *Data 객체의 속성을 검사하여 해당 데이터를 운반하는 Flow에 태깅
        Template_Prohibited_Content_Data[d] implies {
            all f: Flow | f.data = d implies (TH_MX_03 in f.has_threat)
        }
    }

    // [Asset 검사] 자산 무결성 관련 위협
    all a: Asset | {
        // [템플릿 5] 무결성 위반 (Integrity Fail)
        // 조건: 출발지 자산이 해킹됨/미등록/에이전트 미설치
        Template_Integrity_Fail[a] implies {
            all f: Flow | f.from = a implies (TH_MX_04 in f.has_threat)
        }
    }
}

/* *보조 Predicate (Core에 없는 Data 전용 로직) */
pred Template_Prohibited_Content_Data [d: Data] {
    d.content = Malicious or d.is_sanitized = False
}

/* ============================================================
   5. 처방전 매핑 (Prescription)
   * 위협 -> 요구사항 -> 통제 항목 (AND 조건)
   * 근거: 해당 모델 가이드라인 <표 2-2> 매핑 테이블
   ============================================================ */
fact Define_Requirements {
    // (1) 위협과 요구사항 연결
    TH_MX_01.requires = Req_Group_A
    TH_MX_02.requires = Req_Group_B
    TH_MX_03.requires = Req_Group_B
    TH_MX_04.requires = Req_Group_A
    
    // (2) 요구사항과 필수 통제(DB 부품) 연결
    // [변경] N2SF_Controls_DB 항목으로 채워 넣기
    Req_Group_A.mitigated_by = 
        N2SF_IF_2 + N2SF_DU_2 + ... 
        
    Req_Group_B.mitigated_by = 
        N2SF_EB_1 + N2SF_IS_4 + ...
}

/* ============================================================
   ★ 6. 감찰 프로세스 (Meta-Verification)
   * "엔진이 탐지했는데 위협 ID가 누락된 경우"를 찾아내는 안전장치
   * [변경] 위 4번 '탐지 로직'과 동일하게 매핑되었는지 확인
   ============================================================ */
assert Verify_Catalog_Completeness {
    all f: Flow | {
        // [엄격한 검증] 엔진이 켜지면(True) <-> 위협 태그가 있어야 함(True)
        Template_Data_Leak[f]        <=> (TH_MX_01 in f.has_threat)
        Template_Bypass[f]           <=> (TH_MX_02 in f.has_threat)
        // ... 나머지 패턴들도 동일하게 매핑 확인
    }
}

// [개발자용] 이 명령 실행 시 반례가 없어야 함 (No Counterexample)
// check Verify_Catalog_Completeness for 5

module N2SF_Core

/* ==========================================================================
   [N2SF Core Module: The Constitution]
   - 역할: 보안 등급, 망 구조, 자산, 데이터 등 기본 어휘 정의
   - 기능: 5대 핵심 위협 탐지 엔진 (Predicate) 및 적절성 평가 로직 포함
   - 참조: 이 모듈은 모든 Catalog 및 Org 파일에서 'open' 되어야 함
   ==========================================================================
*/

// 1. 등급 체계 (Hierarchy)
// N2SF의 핵심인 C > S > O 위계 질서를 정의 (자동 순서 부여)
open util/ordering[Level]

enum Level { 
    Open,       // 공개 (O) - 가장 낮음
    Sensitive,  // 민감 (S)
    Classified  // 기밀 (C) - 가장 높음
}

// 2. 상태 및 속성 정의 (Status & Properties)
enum Bool { True, False }
enum Zone { Internal, External, DMZ }       // 망 구분
enum Status { Secure, Compromised }         // 장비 무결성 상태
enum ContentType { Clean, Malicious }       // 데이터 내용 상태

// 3. 객체 뼈대 정의 (Abstract Signatures)

// [3-1] 자산 (Asset): PC, 서버, 네트워크 장비 등
abstract sig Asset {
    level: one Level,       // 자산의 보안등급
    zone: one Zone,         // 자산의 위치
    status: one Status,     // 무결성 상태 (해킹 여부 등)
    is_registered: one Bool,// 자산 등록 여부
    has_agent: one Bool     // 보안 에이전트 설치 여부
}

// [3-2] 데이터 (Data): 문서, 파일, 트래픽 등
abstract sig Data {
    classification: one Level, // 데이터 중요도 (C/S/O)
    content: one ContentType,  // 악성코드 포함 여부
    is_sanitized: one Bool     // 무해화(CDR) 처리 여부
}

// [3-3] 특수 자산 (Special Assets for Detection)
// 우회 접속 탐지를 위해 '경유지' 역할을 하는 장비들을 별도 식별
abstract sig Relay extends Asset {}      // 연계체계 (CDS, 망연계)
abstract sig SecurityGW extends Asset {} // 보안 게이트웨이 (방화벽 등)

// [3-4] 흐름 (Flow): 데이터의 이동 경로
sig Flow {
    from: one Asset,
    to: one Asset,
    data: one Data,
    via: set Asset,         // 경로상 거쳐가는 장비들
    is_encrypted: one Bool, // 전송 구간 암호화 여부
    has_threat: set Threat  // *자동 산출* 될 위협 목록
}

// [3-5] 보안 통제 구조 (Threat -> Requirement -> Control)
abstract sig Control {} // 개별 통제 항목 (예: N2SF-EB-6)

abstract sig Requirement {
    mitigated_by: set Control // 이 요구사항을 충족하기 위한 필수 통제 세트
}

abstract sig Threat {
    requires: set Requirement // 이 위협을 해결하기 위해 필요한 요구사항들
}

// [3-6] 기관 구현 현황 (Organization Implementation)
// Layer 4에서 사용자가 입력할 '실제 도입된 장비 목록'
one sig Org_Implementation {
    implemented: set Control, // 실제로 도입/구현한 통제
    exceptions: set Control   // 미구현이지만 예외로 인정한 통제
}


/* ==========================================================================
   [5대 핵심 탐지 엔진] (The 5 Detection Engines)
   - 어떤 상황이 '위협'인지 판별하는 절대 공식
   - Layer 3 (Catalog)에서 이 공식들을 호출하여 사용함
   ==========================================================================
*/

// [Engine 1] 정보 유출 탐지 (Data Leak)
// 원칙: 고등급 데이터가 저등급 자산으로 이동하면 위반
pred Template_Data_Leak [f: Flow] {
    gt[f.data.classification, f.to.level] // Data Level > Asset Level
}

// [Engine 2] 우회 접속 탐지 (Bypass Connection)
// 원칙: 외부에서 내부로 들어올 때 필수 경유지(Relay)가 없으면 위반
pred Template_Bypass [f: Flow] {
    // 1. 영역을 넘나드는 흐름이고 (내부->외부, 외부->내부)
    (f.from.zone != f.to.zone) 
    // 2. 경로(via)와 연계체계(Relay)의 교집합이 없으면(no) 우회!
    and no (f.via & Relay)
}

// [Engine 3] 평문 전송 탐지 (Unencrypted Transmission)
// 원칙: 외부 구간을 지날 때 암호화가 안 되어 있으면 위반
pred Template_Unencrypted [f: Flow] {
    (f.from.zone = External or f.to.zone = External) // 외부와 통신 중인데
    and (f.is_encrypted = False)                     // 암호화가 False임
}

// [Engine 4] 무결성 위반 탐지 (Integrity Fail)
// 원칙: 해킹되었거나, 미등록되거나, 에이전트 없는 장비의 접근은 위반
pred Template_Integrity_Fail [a: Asset] {
    (a.status = Compromised) or 
    (a.is_registered = False) or 
    (a.has_agent = False)
}

// [Engine 5] 금지된 콘텐츠 유입 (Prohibited Content)
// 원칙: 악성코드거나, 무해화(Sanitization) 안 된 파일이 내부로 오면 위반
pred Template_Prohibited_Content [f: Flow] {
    (f.to.zone = Internal) and // 내부로 들어오는 파일인데
    (
        f.data.content = Malicious or // 악성코드이거나
        f.data.is_sanitized = False   // 무해화 처리가 안 됨
    )
}


/* ==========================================================================
   [적절성 평가 로직] (Assessment Logic)
   - 최종적으로 PASS / FAIL을 판정하는 심판관
   ==========================================================================
*/

// Q. 특정 요구사항(Req)이 충족되었는가?
// A. 필수 통제들이 '구현 목록'에 있거나 '예외 목록'에 있어야 함 (AND 조건)
pred Is_Requirement_Met [req: Requirement, org: Org_Implementation] {
    all c: req.mitigated_by | 
        (c in org.implemented) or 
        (c in org.exceptions)
}

// Q. 특정 위협(Threat)이 방어되었는가?
// A. 그 위협에 연결된 모든 요구사항이 충족되어야 함
pred Is_Threat_Mitigated [t: Threat, org: Org_Implementation] {
    all req: t.requires | Is_Requirement_Met[req, org]
}

// Q. (최종 질문) 이 기관은 안전한가? (PASS 조건)
// A. 식별된 모든 위협(흐름에 태깅된 위협들)이 방어되어야 함
pred Check_Security_Pass {
    all f: Flow, t: f.has_threat | 
        Is_Threat_Mitigated[t, Org_Implementation]
}

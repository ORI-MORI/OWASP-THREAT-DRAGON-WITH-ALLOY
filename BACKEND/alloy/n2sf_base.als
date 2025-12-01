module n2sf_base

// 1. 보안 등급 정의 (순서: 공개 < 민감 < 기밀)
open util/ordering[Grade]
enum Grade { Open, Sensitive, Classified }

// 2. 각종 열거형(Enum) 속성 정의
enum ZoneType { Internet, Intranet, DMZ, Wireless }
enum NodeType { Terminal, Server, SecurityDevice, NetworkDevice }
enum AuthType { Single, MFA }
enum Protocol { HTTPS, SSH, VPN_Tunnel, ClearText, SQL }
enum FileType { Document, Executable, Media }
enum Boolean { True, False }

// 3. 위치 (Location/망 영역)
sig Location {
    grade: Grade,
    type: ZoneType
}

// 4. 업무 정보 (Data)
sig Data {
    grade: Grade,
    fileType: FileType
}

// 5. 정보시스템 (System - 주체/객체)
sig System {
    grade: Grade,
    loc: Location,            // 소속된 망
    type: NodeType,
    authType: AuthType,
    isCDS: Boolean,           // 연계체계 여부 (중요)
    isRegistered: Boolean,    // 자산 등록 여부
    stores: set Data          // 저장 중인 데이터
}

// 6. 연결 (Connection - 데이터 흐름)
sig Connection {
    from: System,
    to: System,
    carries: set Data,        // 이 연결을 타고 흐르는 데이터
    protocol: Protocol,
    isEncrypted: Boolean,
    hasCDR: Boolean,          // 무해화 적용 여부
    hasAntiVirus: Boolean     // 악성코드 검사 여부
}
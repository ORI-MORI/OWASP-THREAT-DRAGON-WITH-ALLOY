# OTD-Alloy (N2SF 지능형 감사 도구)

> [!IMPORTANT]
> **현재 개발 진행 중 (Work In Progress)**
> 이 프로젝트는 현재 활발히 개발 중이며, 기능이 변경되거나 불안정할 수 있습니다.
> This project is currently under active development. Features are subject to change and may be unstable.


## 개요
이 프로젝트는 **OWASP Threat Dragon**과 **Alloy Analyzer**를 통합한 전문 보안 감사 도구입니다. **N2SF(국가 망 보안 시설)** 보안 표준에 따라 네트워크 다이어그램을 정형 기법(Formal Methods)으로 검증하도록 설계되었습니다.

사용자는 네트워크 아키텍처를 시각적으로 모델링할 수 있으며, 도구는 암호화되지 않은 채널, 부적절한 망분리, 무단 접근 경로와 같은 보안 위반 사항을 자동으로 탐지합니다.

## 아키텍처
이 시스템은 클라이언트-서버 아키텍처를 따릅니다:

1.  **프론트엔드 (React + ReactFlow)**
    -   시스템, 데이터 흐름, 영역(Zone)을 모델링하기 위한 드래그 앤 드롭 인터페이스를 제공합니다.
    -   시각적 그래프를 구조화된 JSON 페이로드로 변환합니다.
    -   분석 결과를 시각적 하이라이팅(위반 시 빨간색, 선택 시 파란색)으로 표시합니다.

2.  **백엔드 (Node.js + Java)**
    -   **API 서버**: 분석 요청을 처리하는 Express.js 서버입니다.
    -   **Alloy 생성기 (Generator)**: 템플릿 엔진을 사용하여 JSON 모델을 Alloy 명세(`.als`)로 변환합니다.
    -   **Alloy 실행기 (Executor)**: Alloy Analyzer(Java 래퍼)를 호출하여 모델을 풀고 반례(위협)를 찾습니다.
    -   **결과 파서 (Result Parser)**: Alloy의 XML 출력을 파싱하여 정형 위반 사항을 사람이 읽을 수 있는 해결 가이드로 매핑합니다.

## 디렉토리 구조

### 루트 (Root)
-   `FRONTEND_REACT/`: 프론트엔드 애플리케이션
-   `BACKEND/`: 백엔드 서버 및 분석 엔진
-   `alloy/`: 공유 Alloy 리소스 (선택 사항/레거시)

### 프론트엔드 (`FRONTEND_REACT/`)
-   `src/components/`
    -   `Editor.jsx`: 핵심 다이어그램 에디터. 다이어그램 상태, 하이라이팅 로직, 사용자 상호작용을 처리합니다.
    -   `PropertyPanel.jsx`: 요소 속성 편집 및 "위협(Threats)" 목록을 보기 위한 사이드바입니다.
    -   `Sidebar.jsx`: 새로운 노드(시스템, 영역)를 캔버스로 드래그하기 위한 팔레트입니다.
-   `src/utils/`
    -   `graphConverter.js`: ReactFlow 노드/엣지를 백엔드용 N2SF JSON 스키마로 변환하는 핵심 유틸리티입니다. 결정론적 ID 생성을 보장합니다.
-   `src/api/`
    -   `analyze.js`: 백엔드 `/analyze` 엔드포인트와 통신하는 API 클라이언트입니다.

### 백엔드 (`BACKEND/`)
-   `server.js`: 진입점(Entry point). Express 서버를 시작하고 `/analyze` 라우트를 처리합니다.
-   `src/`
    -   `alloyGenerator.js`: 다이어그램 JSON에서 `user_instance_real.als`를 생성합니다. 파일 시스템 안정성을 위한 재시도 로직이 포함되어 있습니다.
    -   `alloyExecutor.js`: `AlloyRunner.java`의 실행을 관리하고, 프로세스 실행을 처리하며, 결과 XML을 파싱합니다.
    -   `AlloyRunner.java`: Alloy JAR와 직접 인터페이스하여 분석을 실행하는 Java 브리지입니다.
-   `alloy/`
    -   `n2sf_base.als`: 핵심 N2SF 보안 모델 및 시그니처 정의입니다.
    -   `n2sf_rules.als`: 보안 규칙 및 어설션(예: `CheckViolations`)입니다.
    -   `user_instance.als`: 생성기가 사용하는 템플릿 파일입니다.
    -   `alloy4.2_2015-02-22.jar`: Alloy Analyzer 엔진입니다.

## 주요 기능
-   **N2SF 규정 준수 확인**: 국가 망 보안 표준 준수 여부를 자동으로 확인합니다.
-   **정형 검증 (Formal Verification)**: 단순 패턴 매칭이 아닌, Alloy의 SAT 솔버를 사용하여 논리적 결함을 철저하게 검사합니다.
-   **인터랙티브 하이라이팅**:
    -   **전체 보기**: 위반 사항이 있는 모든 연결선이 **빨간색**으로 강조됩니다.
    -   **집중 보기**: 특정 위협을 클릭하면 관련 경로가 **파란색**으로 강조됩니다.
-   **견고한 파이프라인**: 신뢰할 수 있는 분석을 보장하기 위해 결정론적 ID 생성 및 오류 복구 기능을 포함합니다.

## 실행 방법

### 사전 요구 사항
-   Node.js (v16 이상)
-   Java Runtime Environment (JRE) (Alloy 실행용)

### 1. 백엔드 시작
```bash
cd BACKEND
node server.js
# 서버는 http://localhost:3001 에서 실행됩니다.
```

### 2. 프론트엔드 시작
```bash
cd FRONTEND_REACT
npm run dev
# 애플리케이션은 http://localhost:5173 에서 실행됩니다.
```

## 사용 흐름 (Workflow)
1.  **그리기 (Draw)**: 시스템과 영역을 캔버스로 드래그하고 흐름(Flow)으로 연결합니다.
2.  **설정 (Configure)**: 요소를 클릭하여 속성을 설정합니다 (예: 프로토콜: HTTP, 암호화: False).
3.  **분석 (Analyze)**: "Analyze" 버튼을 클릭합니다.
4.  **검토 (Review)**: "Threats" 탭에서 위반 사항을 확인합니다. 위협을 클릭하면 다이어그램에서 정확한 위치를 확인할 수 있습니다.

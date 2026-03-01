import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
    html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background-color: #f7f9fc;
        /* iOS 사파리 스크롤 바운스 현상 방지 */
        overscroll-behavior-y: none; 
    }
    * {
        box-sizing: border-box;
    }
    body {
        font-family:
            "Pretendard",
            -apple-system,
            BlinkMacSystemFont,
            system-ui,
            Roboto,
            sans-serif;
    }
`;

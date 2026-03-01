import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
    html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background-color: #f7f9fc;
        /* overscroll-behavior-y: none; 를 제거하여 새로고침 제스처 허용 */
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

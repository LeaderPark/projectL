-- phpMyAdmin SQL Dump
-- version 4.8.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- 생성 시간: 23-10-10 23:17
-- 서버 버전: 10.3.8-MariaDB
-- PHP 버전: 7.2.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 데이터베이스: `bot`
--

-- --------------------------------------------------------

--
-- 테이블 구조 `matches`
--

CREATE TABLE `matches` (
  `id` int(11) NOT NULL,
  `game_id` varchar(50) NOT NULL,
  `game_length` varchar(50) NOT NULL,
  `purple_team` longtext NOT NULL,
  `blue_team` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 테이블 구조 `match_in_users`
--

CREATE TABLE `match_in_users` (
  `id` int(11) NOT NULL,
  `match_id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 테이블 구조 `user`
--

CREATE TABLE `user` (
  `discord_id` varchar(50) NOT NULL,
  `puuid` varchar(255) NOT NULL,
  `name` varchar(50) NOT NULL,
  `mmr` mediumint(8) UNSIGNED NOT NULL DEFAULT 1000,
  `win` mediumint(8) UNSIGNED NOT NULL DEFAULT 0,
  `lose` mediumint(8) UNSIGNED NOT NULL DEFAULT 0,
  `penta` mediumint(8) UNSIGNED NOT NULL DEFAULT 0,
  `quadra` mediumint(8) UNSIGNED NOT NULL DEFAULT 0,
  `champions` longtext NOT NULL,
  `lanes` longtext NOT NULL,
  `friends` longtext NOT NULL,
  `t_kill` mediumint(8) UNSIGNED NOT NULL DEFAULT 0,
  `t_death` mediumint(8) UNSIGNED NOT NULL DEFAULT 0,
  `t_assist` mediumint(8) UNSIGNED NOT NULL DEFAULT 0,
  `t_kill_rate` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- 테이블의 덤프 데이터 `user`
--

INSERT INTO `user` (`discord_id`, `puuid`, `name`, `mmr`, `win`, `lose`, `penta`, `quadra`, `champions`, `lanes`, `friends`, `t_kill`, `t_death`, `t_assist`, `t_kill_rate`) VALUES
('265362921276571649', 'QT27KWL5JacuVpw79A3jdLJqzVB-9E8Yn81M7AnmgvjA5g3CK8kJ5nsUt94VJFRGEk6UaDCEvGn7Fw', 'eggcat', 1200, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('272202649817055254', 'I9XuiMyf2ZE1YpdB5BK-_VYk-Z08TOcjkyW3tnVWoD43TcXqj3KA47uEBZGS3bjWkkMARYsitHGoYQ', '성윰서', 1200, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('295012602432454657', 'mh1AgzUaHOis84nlsh_cd6oGS6J0rMzlMLLENNFPc2Pupqcg5yxJvFyWxR2Z0Nru9RnEaghdLFcfzQ', 'KTR', 1500, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('312944278244556800', '15LWmULxbTGOFQpC9NdvZkVT9YyE0SU7z4mY1q79c1iChANYcerDQS62rGvM3FgHwwaFsuNhT8s71w', '쿠노마', 1700, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('331009983145574415', 'qAjGnmQPXSclhHbRPt_cYAJrIKdLEkBpXUSJsLAEJkv08j8VvwKL2YbLP4Oie3iIJrTn0MFRoEq-CQ', 'Eukkbi', 1100, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('349123074433482752', 'GwK2cN7SkEH9vTDGoZA7kYZpyE0MKen5CXQ7Lq4az2sH7NxIPmb2MWJdDEgC5jzMYAnevqqzP93tDg', 'notDevblue', 1000, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('350961830702743552', 'eSn_A4br5X4q5ddtoRXsCHGuSbOkXGdujUdU3-UxGWnPrz7NrbLD7bS-Z-a_OxF75Y9GEjDm7PsPvg', '네트워크PC', 1700, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('357483772037300225', 'kgj3AJFdj4REOE4t7lMcR0QfpBdBblIJxlLUn7WcyYUsM9i0IRm6GtgV2fP2x3Vl2rc0Z745JsWBkA', 'Anglik', 1300, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('360681772910116868', 'JQNWIoeuiqEkwwepw2MJx6N-p3jCEIMKL8-BQMkEfMbW07AcvQPgd1ijXSN1kZ_sva9Ci_FErYgC8Q', '재유츄릅', 1500, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('363662382163165184', 'pU5IyIpX39x55r_1nndnJw-mvdPNmWRGEMOQHMpd6eEZ1of5t-u8BGZDySuFSlrFKRXLeLU9mHtfgQ', '쁠릅쁠릅', 1200, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('366865806816182284', '5e59M6HiiJTZkqOJKG2of9cF81p9tKfZmadVjmFzL3BwaHVAhvAb_uW7ZJFdGyteiqVW_10PAH7FBg', '한국게임은망했다', 1500, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('366889429308145674', '6V4YzHvAA7HX-4U4Eqc8kofz21Rx8wJ8sG-wN3EJzV0OMussZNzL6Uqi9-UMKPGv4qCkRkrddchn3Q', '최 선 한', 1700, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('371545107511509007', 'mIZLI0bxFCkrp973rEdnoGO1UBh72gJEXwXam_OQraeAavyJZ0aS1-KlDv0WC9J-UkAiKcfnnmNF1Q', '손환주몽둥이찜질', 1700, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('406339739374059532', 'Lw3MNr0WQthxHncDudEZ7OEX2GuTHk-R1P0NGi8Yo1B3esEJJ6kalVqT_etI5s3u24tX8ftuznIznQ', 'HS043212', 1100, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('416618806606037004', 'cyBbI05DXlSgnuxEcRQDD2jCpEmHsPvoXY5c07xX1q9Hf1YlWKHDI7xsuhgJaojTTjNbW3azLiHNaQ', '연혜지', 1300, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('442936082640666624', 'fM7r7vN5vHI-u_0HPR9mSoJHg5xzP8_1imJWJSn9E8LWzF6doFlTViP6GNLITANxJCnIxQTy1xWpLg', 'Shu Ouma', 1700, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('447369325695729674', 'JUnmfb59997i6aT1rKy5dUVW5XJ1Qqq7BQ0zf1CuEERhIuwMN_ETClSg-SYSw4YYaLX_XSaagTx0kA', '김여못이', 1200, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('450980233252962305', 'Ts4YicRWFugzHo_rdqXRGF1PYWPkMRKsa7h98gC3s2nvpIVDdFI82Yoee2dDPRZSAdo6X_aXwLmIFg', 'qmfhswmek', 1700, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('462599848495939605', 'lMKUCDAAB0PHd9bxa8z8LTrqd2tubey2-6as1Fv7cZ5oM4IJvU71F8m0Oc1EyFFy_uxf0vOCknxQvw', '쵸     323    콕', 1100, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('472976039325335555', 'lvt29hAkbdRRBvs2--dRrEYQ7c3iwXuV4jXZ3DAz58Nl-EyClMuS_HNHpy5YPWx5K0aqs9PTSZNCLA', '쥬몬지', 1300, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('485334207724257301', 'ZOnoVeFsd8YHQxVn0C72ewcAomym5oEIdWR_HwGemYYudvfm6HVii1V7EQgb36Auyf4trrI07Zvs7A', '컹 새', 1300, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('492853582207516673', 'zsh-RKH4KBhtbqDjC2ZEq7_mGpBHjGlYlT28SwcE9U35lPBS3oyhMukucMTOOx4ugOMPg70BD69dQA', '레몬맛사탕의추억', 1500, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('495778699715805204', 'OUSMMO-BTKGxriytnjgJ2LnrwXd5x3JGzrzZ-TE0jAh9jIZmA4qYqElR89e7ASNvt-oNJ8Lc0yqNiw', 'ZAC MEISTER', 1300, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('532565769100460053', 'Z9Z3cylxgVWU54eWiL6ppNqE1koZCCoN_kHcQbcY7DbOG2WHWPKOpucam_Dwyj284hfIXHQmEW-Rwg', '줄기세포823호', 1000, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('542505643349639198', 'KiqRXpwv9J19RSzuRFwciv7W_CSsJz9r-BKzKJkup_ss-7KGRqTqMI9ELvzf37ASXeMKzZitjCexwA', '이 게임을 지는법', 1500, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('593443048957149224', 'ED4F4EF-Exm5I5mgt6re-erz2dWxV3Mgjt8xCMDj1FmStpxHDNwVlwdCCsE-ANuLXmfM_7yWOgKnjQ', '귀엽다 비챤', 1100, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('687809180719251458', 'tWoccO-bVVrhIjKrkf_WgMga0KiUoRJj0DYtMeBMekK_C2ueG1tsk--mZKhh9r6pNBFsAdXoLwUEGg', 'Shacco', 1700, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('694806416464019546', '128FqaHMtOmqaSQB4PawXuwWiOyZKo6QDzwuTNt23wq_bYAK0XfzkyqvWbczowqDWEWS6IuDcPILXg', '둥둥이멍멍', 1700, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('700166825752658010', 'v4zijdzkV0ihFRs2MhrcQhAyhaY_d6aBUq4nJzIvXvSeXjPflJMBJtzNEBzYVzjC6Wyt16EoDoSt8Q', '피냄새나누', 1300, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('700175686022856757', 'l4CXzSMdnT2Otkxri75EQ9xaKrQYVc-4cmj29bOnd9n86hXqXh3H-lb-mafDgPnI9DI5JQPinBRV3Q', '레데션', 1300, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('709953013908766842', 'HSPE7hvSll3SlE3pN60E0308xKx2qdkDf5cgIHq7v62jL0VJyHV8PREcxEL2BKVnpdAMziuG22TMEg', '스팁군', 1200, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('721301942298476545', 'Zt-w578mNrExDRh7Vfv6GoqwLFpIxY6vdKxjOH0Pxmx-2kcy5cQPcxIKtNuHXmjpzLyJmkXZfqcXPQ', '드래곤링크20소환', 1300, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0),
('733265153931608155', 'i62gjrTw6T95ruFvSxjg4Lne07wX-MNQE_45lBRIVX_N5RWXIfmLjZIit0fixsFKaJ8Y_q2QZ_snDA', 'Oscarn', 1300, 0, 0, 0, 0, '', '', '', 0, 0, 0, 0);

--
-- 덤프된 테이블의 인덱스
--

--
-- 테이블의 인덱스 `matches`
--
ALTER TABLE `matches`
  ADD PRIMARY KEY (`id`);

--
-- 테이블의 인덱스 `match_in_users`
--
ALTER TABLE `match_in_users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_bot_matches` (`match_id`),
  ADD KEY `fk_bot_user` (`user_id`);

--
-- 테이블의 인덱스 `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`discord_id`);

--
-- 덤프된 테이블의 AUTO_INCREMENT
--

--
-- 테이블의 AUTO_INCREMENT `matches`
--
ALTER TABLE `matches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- 테이블의 AUTO_INCREMENT `match_in_users`
--
ALTER TABLE `match_in_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=158;

--
-- 덤프된 테이블의 제약사항
--

--
-- 테이블의 제약사항 `match_in_users`
--
ALTER TABLE `match_in_users`
  ADD CONSTRAINT `fk_bot_matches` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_bot_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`discord_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

package org.example.video_ai.enums;
/*
* video题材
* */
public enum VideoGenre {
    ACTION("Action"), //动作
    ROMANCE("Romance"), //爱情
    COMEDY("Comedy"), //喜剧
    SUSPENSE("Suspense"), //悬疑
    SCI_FI("Science fiction"), //科幻
    DOCUMENTARY("Documentary"),  //纪录片
    ANIMATION("Animation"), //动画
    FAMILY("Family"), //家庭
    REALITY("Reality"), //真人秀
    OTHER("Other"); //其他

    private final String description;

    VideoGenre(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

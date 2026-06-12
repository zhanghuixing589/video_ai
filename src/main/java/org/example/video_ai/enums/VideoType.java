package org.example.video_ai.enums;
/*
* video 类别
* */
public enum VideoType {
    MOVIE("Movie"),  //电影
    VARIETY("Variety show"),  //综艺
    TV_SERIES("TV series");  //电视剧

    private final String description;

    VideoType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

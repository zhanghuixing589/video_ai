package org.example.video_ai.enums;

/*
* 角色
* */
public enum Role {
    //管理员
    ADMIN("Administrator", "Can manage every page, user, and permission"),
    //审核员
    REVIEWER("Reviewer", "Can review studio submitted videos"),
    //创作者 - 制片厂
    STUDIO("Studio", "Can apply for studio access and submit videos"),
    // 普通用户
    USER("User", "Can search, watch, and interact with published videos");

    private final String name;
    private final String description;

    Role(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }
}
